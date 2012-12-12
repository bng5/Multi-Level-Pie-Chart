
MultiLevelPieChart
==================

Properties
----------

root
: MultiLevelPieChartSector root
since 1.0

total
: int total
since 1.0

tooltip
: object { textFormat: '', color: '', highlightColor: ''}
since 1.0


Methods
-------

void **loadData**( string _url_ [, string _format_] )


void **draw**( string _htmlElementId_ )



MultiLevelPieChartSector
========================

Properties
----------

label


Methods
-------

MultiLevelPieChartSector **addSector**(object _params_)




Examples
========

```javascript
    var chart = new MultiLevelPieChart();
        chart.root.label = 'Raíz';

        var xml = chart.root.addSector({label: 'XML', value: 50});//, color: '#ff0000'
        var php = chart.root.addSector({label: 'PHP', value: 45});//, color: '#0000ff'
        var css = chart.root.addSector({label: 'CSS', value: 5});//, color: '#00ff00'

        var svg = xml.addSector({label: 'SVG', value: 50});//, color: '#FF9999'
        var docbook = xml.addSector({label: 'DocBook', value: 50});//, color: '#FF5555'
        var docbook5 = docbook.addSector({label: 'DocBook5', value: 15});//, color: '#FFAAAA'

        chart.draw('contenedor');
        console.log(chart);
        global.chart = chart;
```

