if(!window.console) {
    console = {
        log: function() {},
        group: function() {},
        groupCollapsed: function() {},
        groupEnd: function() {}
    }
}

var global = {};

var debug = {
    printSector: function(sector) {
        console.groupCollapsed(sector.label);
            console.log('color: %d', sector.color);
            console.log('value: %d', sector.value);
            console.log('percent: %d', sector.percent);
            for(var i = 0; i < sector.children.length; i++) {

                debug.printSector(sector.children[i]);
//                console.group(sector.children[i].label);
//                console.log('color: ', sector.children[i].color);
//                console.groupEnd();
            }
        console.groupEnd();
    }
};

function mostrarRespuesta(objRespuesta, salida) {

	if(typeof objRespuesta == 'object') {
		var lista = document.createElement('ul');
		//var lista = document.createElementNS(NS.HTML, 'ul');
		salida.appendChild(lista);
		for(var k in objRespuesta) {
			var item = document.createElement('li');
			//var item = document.createElementNS(NS.HTML, "li");

			var em = item.appendChild(document.createElement('em'));
			//var em = item.appendChild(document.createElementNS(NS.HTML, "em"));
			em.appendChild(document.createTextNode(k+': '));
			mostrarRespuesta(objRespuesta[k], item);
			lista.appendChild(item);
		}
	}
	else
		salida.appendChild(document.createTextNode(objRespuesta));
}

String.prototype.format = function() {
	var args = arguments;
	return this.replace(/{(\d+)}/g, function(match, number) {
		return typeof args[number] != 'undefined'
		? args[number]
		: match;
	});
};

////////////////////////////////////////////////////////////////////////////////

function MultiLevelPieChart() {
    this.root = new MultiLevelPieChartSector();
    this.root.label = 'Root';
    this.root.color = '#cccccc';
    this.tooltip = {color: '#000000', textFormat: 'label: {label} \n {percent}% \n'}
}

MultiLevelPieChart.prototype = {
    XMLNS_SVG: 'http://www.w3.org/2000/svg',
    _rootValue: function() {
        if(!this.root.value) {
            var total = 0;
            for(var i = 0; i < this.root.children.length; i++) {
                total += this.root.children[i].value;
            }
            this.root.value = total;
        }
        return this.root.value;
    },
    _calculateValues: function(sector) {
		var total = 0;
		for(var i = 0; i < sector.children.length; i++) {
			this._calculateValues(sector.children[i]);
			total += sector.children[i].value;
		}
		if(!sector.value) {
			sector.value = total;
		}
		if(total > sector.value) {
			throw {
				message: "Total es mayor al valor {0} > {1}, {2}".format(total, sector.value, sector.label)
			};
        }
	},
    __calculatePercentages: function(sector) {
        var d = (100 / sector.value);
        var total = 0;
        for(var i = 0; i < sector.children.length; i++) {
            total += sector.children[i].value;
            sector.children[i].percent = (sector.children[i].value * d);
            this._calculatePercentages(sector.children[i]);
        }
        if(total > sector.value) {
			throw {
				message: "Total es mayor al valor {0} > {1}, {2}".format(total, sector.value, sector.label)
			};
        }
    },
    _calculatePercentages: function(sector) {
		var parentValue = 100;
		if(!sector.parent) {
			sector.percent = 100;
		}
        var d = (100 / this.root.value);
        for(var i = 0; i < sector.children.length; i++) {
            sector.children[i].percent = (sector.children[i].value * d);
            this._calculatePercentages(sector.children[i]);
        }
    },
    createSector: function(data) {
		var sector = new MultiLevelPieChartSector();
		sector.label = data.label;
		sector.value = data.value;
		return sector;
	},
    draw: function(element) {
        //this._rootValue();
        try {
			this._calculateValues(this.root);
			this._calculatePercentages(this.root);
		} catch(err) {
			this._printError(err.message);
			return;
		}

        //debug.printSector(this.root);

        var cont = document.getElementById(element);
        var svg = cont.appendChild(document.createElementNS(this.XMLNS_SVG, 'svg'));

//global.puntosG = svg.appendChild(document.createElementNS(this.XMLNS_SVG, 'g'));
//global.puntosG.setAttribute("stroke", "black");
//global.puntosG.setAttribute("stroke-width", "3");
//global.puntosG.setAttribute("fill", "black");



        this._svg = svg;
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '-200 -200 400 400');
        svg.setAttribute('version', '1.1');
        var g = svg.appendChild(document.createElementNS(this.XMLNS_SVG, 'g'));
        var path = g.appendChild(document.createElementNS(this.XMLNS_SVG, 'path'));
        this.root.addEventListener('mouseover', path);
        //path.setAttribute('onmouseover', "brillo2(this)");
        path.setAttribute('onmouseout', "this.setAttribute('fill', '"+this.root.color+"')");
        //path.setAttribute('title', this.root.label);
        path.setAttribute('stroke', '#000000');
        path.setAttribute('stroke-width', '1');
        path.setAttribute('fill', this.root.color);
        this.root.A = [50, 0];
        this.root.radius = 50;
        path.setAttribute('d', 'M'+this.root.A[0]+','+this.root.A[1]+' '+
                               'A'+this.root.radius+','+this.root.radius+' 0 1,0 -50,0 A'+this.root.radius+','+this.root.radius+' 0 1,0 50,0 z');
        this._drawChildren(this.root, 1);

        var tooltip = svg.appendChild(document.createElementNS(this.XMLNS_SVG, 'g'));
        var rect = tooltip.appendChild(document.createElementNS(this.XMLNS_SVG, 'rect'));
        rect.setAttribute('x', '-300');
        rect.setAttribute('y', '-300');
        rect.setAttribute('rx', '5');
        rect.setAttribute('ry', '5');
        rect.setAttribute('style', 'fill:#000000;fill-opacity:0.9;fill-rule:nonzero;stroke:none;');
        var text = tooltip.appendChild(document.createElementNS(this.XMLNS_SVG, 'text'));
        text.setAttribute('x', '-300');
        text.setAttribute('y', '-300');
        text.setAttribute('style', 'font-size:12px;font-style:normal;font-weight:normal;line-height:100%;letter-spacing:0px;word-spacing:0px;fill:#ffffff;fill-opacity:1;stroke:none;font-family:Bitstream Vera Sans, sans-serif;');
        text.appendChild(document.createTextNode('ToolTip'));
        global.tooltip = tooltip;
    },
    _printError: function(message) {
		console.error(message);
	},
    _drawChildren: function(parentSector, level) {

        if(parentSector.children.length) {
            parentSector._childPos = [(parentSector.A[0] * (1 + (50 / parentSector.radius))), (parentSector.A[1] * (1 + (50 / parentSector.radius)))];

            var g2 = this._svg.insertBefore(document.createElementNS(this.XMLNS_SVG, 'g'), this._svg.firstChild);
            var sector;
            var angle, bigger;
            var B;
            var d = (100 / parentSector.value);
            for(var i = 0; i < parentSector.children.length; i++) {
                sector = parentSector.children[i];
                path = g2.appendChild(document.createElementNS(this.XMLNS_SVG, 'path'));
                var self = sector;
                sector.addEventListener('mouseover', path);
                //path.setAttribute('onmouseover', "brillo2(this)");
                path.setAttribute('onmouseout', "this.setAttribute('fill', '"+sector.color+"')");
                path.setAttribute('stroke', '#000000');
                path.setAttribute('stroke-width', '1');
                path.setAttribute('fill', sector.color);
                path.setAttribute('style', 'cursor:pointer;');
                sector.radius = ((level + 1) * 50);
                sector.percent = Math.round(sector.percent);
                //angle = -(sector.percent * ((2 * Math.PI) / (100 * (100 / this.root.value))));//parentSector.value))));
                angle = -(sector.percent * (2 * Math.PI) / 100);//parentSector.value))));
                bigger = (angle < 0 - Math.PI) ? 1 : 0;
                sector.A = parentSector._childPos;
                B = [];
                B.push((sector.A[0] * Math.cos(angle)) + (sector.A[1] * Math.sin(angle)));
                B.push(((0 - sector.A[0]) * Math.sin(angle)) + (sector.A[1] * Math.cos(angle)));
                path.setAttribute('d', 'M'+sector.A[0]+','+sector.A[1]+' '+
                                       'A'+sector.radius+','+sector.radius+' 0 '+bigger+',1 '+B[0]+','+B[1]+' '+
                                       'L0,0 z');
                //path.setAttribute('title', sector.label+' ('+sector.percent+'%) ['+sector.A[0]+','+sector.A[1]+'] - ['+B[0]+','+B[1]+'] '+angle+'º');
                parentSector._childPos = B;
                this._drawChildren(sector, level + 1);
//                $el->setAttribute('d', "M{$el->A[0]},{$el->A[1]} ".
//                       "A{$el->radio},{$el->radio} 0 {$mayor},1 {$B[0]},{$B[1]} ".
//                       "L0,0 ".
//                       "z");
            }
        }
    },
    highlight: function() {
        
    }
};

function MultiLevelPieChartSector(value, label, color, highlight) {
    this.value = value;
    this.label = label;
    this.color = color ? color : randomColor();
    this.highligth = highlight ? highlight : randomColor();
    //this.description;
    this.children = [];
//    this.parent;
//    this.level = 0;
    this.percent;
}

MultiLevelPieChartSector.prototype = {
    appendChild: function(data) {

        var value = data.value ? data.value : null;
        var label = data.label ? data.label : null;
        var color = data.color ? data.color : null;
        var highlight = data.highlight ? data.highlight : null;

        //{label: 'XML', color: '#ff0000', value: 50}
        var sector = new MultiLevelPieChartSector(value, label, color, highlight);
        sector.parent = this;
        //sector.level = this.level+1;
        this.children.push(sector);
        return sector;
    },
    addEventListener: function(type, element) {
        var self = this;
        element.addEventListener(type, function(event) {
            brillo2(element, self, (event.clientX - 200), (event.clientY - 200) );
        }, false);
    }
};


function brillo2(el, sector, x, y) {
    //var el = document.getElementById(el);
    //window.getComputedStyle(el, null).getPropertyValue('background-image')
    var fill = el.getAttribute('fill');
    var re;

var str = global.chart.tooltip.textFormat;
str = str.replace('{label}', sector.label);
str = str.replace('{percent}', sector.percent);
str = str.replace('{value}', sector.value);
var rect = global.tooltip.childNodes[0];
var text = global.tooltip.childNodes[1];
while(text.firstChild != null) {
    text.removeChild(text.firstChild);
}
//global.tooltip.firstChild.firstChild.replaceData(0, global.tooltip.firstChild.firstChild.length, str);
var lines = str.split('\n');
text.setAttribute('x', x);
text.setAttribute('y', y);
rect.setAttribute('x', (x - 5));
rect.setAttribute('y', (y - 17));
if(lines.length == 1) {
    text.appendChild(document.createTextNode(lines[0]));
}
else if(lines.length > 1) {
    var tspan;
    //var y = -300;
    for(var i = 0; i < lines.length; i++) {
        tspan = text.appendChild(document.createElementNS(global.chart.XMLNS_SVG, 'tspan'));
        tspan.appendChild(document.createTextNode(lines[i]));
        tspan.setAttribute('x', x);
        tspan.setAttribute('y', y);
        y += 20;
    }
	var bbox = text.getBBox();

	rect.setAttribute('width', (bbox.width + 10));
	rect.setAttribute('height', (bbox.height + 10));
}

    re = /^#([A-Fa-f0-9]{2})([A-Fa-f0-9]{2})([A-Fa-f0-9]{2})$/;


    if(rgb = re.exec(fill)) {

        rgb[1] = parseInt(rgb[1], 16),
        rgb[2] = parseInt(rgb[2], 16),
        rgb[3] = parseInt(rgb[3], 16);

    }
    else {
        re = /^rgb\((\d+) ?,(\d+) ?,(\d+)\)$/;
        rgb = re.exec(fill);
    }

    var hsv = rgbToHsv(rgb[1], rgb[2], rgb[3]);
    hsv[1] = (hsv[1] * 0.6);
    hsv[1] = (hsv[1] < 0) ? 0 : hsv[1];
    hsv[2] = (hsv[2] * 1.2);
    hsv[2] = (hsv[2] > 1) ? 1 : hsv[2];
    rgb = hsvToRgb(hsv[0], hsv[1], hsv[2]);
    el.setAttribute('fill', 'rgb('+rgb.join(',')+')');
}

function randomColor(format) {
    var rint = Math.round(0xffffff * Math.random());
//    switch(format) {
//        case 'hex':
            return ('#0' + rint.toString(16)).replace(/^#0([0-9a-f]{6})$/i, '#$1');
//            break;
//        case 'rgb':
//            return 'rgb(' + (rint >> 16) + ',' + (rint >> 8 & 255) + ',' + (rint & 255) + ')';
//            break;
//        default:
//            return rint;
//            break;
//    }
}


/******************************************************************************/


/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSL representation
 */
function rgbToHsl(r, g, b){
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return [h, s, l];
}

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [r * 255, g * 255, b * 255];
}

/**
 * Converts an RGB color value to HSV. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and v in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSV representation
 */
function rgbToHsv(r, g, b){
    r = r/255, g = g/255, b = b/255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max == 0 ? 0 : d / max;

    if(max == min){
        h = 0; // achromatic
    }else{
        switch(max){
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return [h, s, v];
}

/**
 * Converts an HSV color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes h, s, and v are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  v       The value
 * @return  Array           The RGB representation
 */
function hsvToRgb(h, s, v){
    var r, g, b;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch(i % 6){
        case 0:r = v, g = t, b = p;break;
        case 1:r = q, g = v, b = p;break;
        case 2:r = p, g = v, b = t;break;
        case 3:r = p, g = q, b = v;break;
        case 4:r = t, g = p, b = v;break;
        case 5:r = v, g = p, b = q;break;
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}



/******************************************************************************/