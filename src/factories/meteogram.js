import $ from 'jquery';
import Highcharts from 'highcharts';

import app from './../app';

app.service('meteogramService', [function () {
    function Meteogram(data, container, countryName, countryCode) {
        this.symbols = [];
        this.symbolNames = [];
        this.windDirections = [];
        this.windSpeeds = [];
        this.temperatures = [];
        this.pressures = [];
    
        // Initialize
        this.data = data;
        this.container = container;
        this.countryName = countryName;
        this.countryCode = countryCode;
    
        // Run
        this.parseYrData();
    }
    
    /**
     * Function to smooth the temperature line. The original data provides only whole degrees,
     * which makes the line graph look jagged. So we apply a running mean on it, but preserve
     * the unaltered value in the tooltip.
     */
    Meteogram.prototype.smoothLine = function (data) {
        var i = data.length,
            sum,
            value;
    
        while (i--) {
            data[i].value = value = data[i].y; // preserve value for tooltip
    
            // Set the smoothed value to the average of the closest points, but don't allow
            // it to differ more than 0.5 degrees from the given value
            sum = (data[i - 1] || data[i]).y + value + (data[i + 1] || data[i]).y;
            data[i].y = Math.max(value - 0.5, Math.min(sum / 3, value + 0.5));
        }
    };
    
    /**
     * Callback function that is called from Highcharts on hovering each point and returns
     * HTML for the tooltip.
     */
    Meteogram.prototype.tooltipFormatter = function (tooltip) {
    
        // Create the header with reference to the time interval
        var index = tooltip.points[0].point.index,
            ret = '<small>' + Highcharts.dateFormat('%A, %b %e, %H:%M', tooltip.x) + '-' +
                Highcharts.dateFormat('%H:%M', tooltip.points[0].point.to) + '</small><br>';
    
        // Symbol text
        ret += '<b>' + this.symbolNames[index] + '</b>';
    
        ret += '<table>';
    
        // Add all series
        Highcharts.each(tooltip.points, function (point) {
            var series = point.series;
            ret += '<tr><td><span style="color:' + series.color + '">\u25CF</span> ' + series.name +
                ': </td><td style="white-space:nowrap">' + Highcharts.pick(point.point.value, point.y) +
                series.options.tooltip.valueSuffix + '</td></tr>';
        });
    
        // Add wind
        ret += '<tr><td style="vertical-align: top">\u25CF Wind</td><td style="white-space:nowrap">' +
            ' (' + Highcharts.numberFormat(this.windSpeeds[index], 1) + ' m/s)</td></tr>';
    
        // Close
        ret += '</table>';
    
    
        return ret;
    };
    
    /**
     * Draw the weather symbols on top of the temperature series. The symbols are sprites of a single
     * file, defined in the getSymbolSprites function above.
     */
    Meteogram.prototype.drawWeatherSymbols = function (chart) {
        var meteogram = this;
    
        $.each(chart.series[0].data, function (i, point) {
            var group;
    
            if (meteogram.resolution > 36e5 || i % 2 === 0) {
                // Create a group element that is positioned and clipped at 30 pixels width and height
                group = chart.renderer.g()
                    .attr({
                        translateX: point.plotX + chart.plotLeft - 15,
                        translateY: point.plotY + chart.plotTop - 30,
                        zIndex: 5
                    })
                    .clip(chart.renderer.clipRect(0, 0, 50, 50))
                    .add();

                // Position the image inside it at the sprite position
                chart.renderer.image(
                        `http://openweathermap.org/img/w/${meteogram.symbols[i]}.png`,
                        0,
                        0,
                        30,
                        30
                    )
                    .add(group);
            }
        });
    };
    
    /**
     * Create wind speed symbols for the Beaufort wind scale. The symbols are rotated
     * around the zero centerpoint.
     */
    Meteogram.prototype.windArrow = function (name) {
        var level,
            path;
    
        // The stem and the arrow head
        path = [
            'M', 0, 7, // base of arrow
            'L', -1.5, 7,
            0, 10,
            1.5, 7,
            0, 7,
            0, -10 // top
        ];
    
        level = $.inArray(name, ['Calm', 'Light air', 'Light breeze', 'Gentle breeze', 'Moderate breeze',
            'Fresh breeze', 'Strong breeze', 'Near gale', 'Gale', 'Strong gale', 'Storm',
            'Violent storm', 'Hurricane']);
    
        if (level === 0) {
            path = [];
        }
    
        if (level === 2) {
            path.push('M', 0, -8, 'L', 4, -8); // short line
        } else if (level >= 3) {
            path.push(0, -10, 7, -10); // long line
        }
    
        if (level === 4) {
            path.push('M', 0, -7, 'L', 4, -7);
        } else if (level >= 5) {
            path.push('M', 0, -7, 'L', 7, -7);
        }
    
        if (level === 5) {
            path.push('M', 0, -4, 'L', 4, -4);
        } else if (level >= 6) {
            path.push('M', 0, -4, 'L', 7, -4);
        }
    
        if (level === 7) {
            path.push('M', 0, -1, 'L', 4, -1);
        } else if (level >= 8) {
            path.push('M', 0, -1, 'L', 7, -1);
        }
    
        return path;
    };
    
    /**
     * Draw the wind arrows. Each arrow path is generated by the windArrow function above.
     */
    Meteogram.prototype.drawWindArrows = function (chart) {
        var meteogram = this;
    
        $.each(chart.series[0].data, function (i, point) {
            var arrow, x, y;
    
            if (meteogram.resolution > 36e5 || i % 2 === 0) {
    
                // Draw the wind arrows
                x = point.plotX + chart.plotLeft + 7;
                y = 255;
                arrow = chart.renderer.path(
                    meteogram.windArrow()
                ).attr({
                    rotation: parseInt(meteogram.windDirections[i], 10),
                    translateX: x, // rotation center
                    translateY: y // rotation center
                });
                arrow.attr({
                    stroke: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black',
                    'stroke-width': 1.5,
                    zIndex: 5
                })
                .add();
    
            }
        });
    };
    
    /**
     * Draw blocks around wind arrows, below the plot area
     */
    Meteogram.prototype.drawBlocksForWindArrows = function (chart) {
        var xAxis = chart.xAxis[0],
            x,
            pos,
            max,
            isLong,
            isLast,
            i;
    
        for (pos = xAxis.min, max = xAxis.max, i = 0; pos <= max + 36e5; pos += 36e5, i += 1) {
    
            // Get the X position
            isLast = pos === max + 36e5;
            x = Math.round(xAxis.toPixels(pos)) + (isLast ? 0.5 : -0.5);
    
            // Draw the vertical dividers and ticks
            if (this.resolution > 36e5) {
                isLong = pos % this.resolution === 0;
            } else {
                isLong = i % 2 === 0;
            }
            chart.renderer.path(['M', x, chart.plotTop + chart.plotHeight + (isLong ? 0 : 28),
                'L', x, chart.plotTop + chart.plotHeight + 32, 'Z'])
                .attr({
                    'stroke': chart.options.chart.plotBorderColor,
                    'stroke-width': 1
                })
                .add();
        }
    };
    
    /**
     * Build and return the Highcharts options structure
     */
    Meteogram.prototype.getChartOptions = function () {
        var meteogram = this;
    
        return {
            chart: {
                renderTo: this.container,
                marginBottom: 70,
                marginRight: 40,
                marginTop: 50,
                plotBorderWidth: 1,
                width: 800,
                height: 310
            },
    
            title: {
                text: `${meteogram.countryName}, ${meteogram.countryCode.toUpperCase()}`
            },
    
            credits: {
                text: null,
                href: null
            },
    
            tooltip: {
                shared: true,
                useHTML: true,
                formatter: function () {
                    return meteogram.tooltipFormatter(this);
                }
            },
    
            xAxis: [{ // Bottom X axis
                type: 'datetime',
                tickInterval: 2 * 36e5, // two hours
                minorTickInterval: 36e5, // one hour
                tickLength: 0,
                gridLineWidth: 1,
                gridLineColor: (Highcharts.theme && Highcharts.theme.background2) || '#F0F0F0',
                startOnTick: false,
                endOnTick: false,
                minPadding: 0,
                maxPadding: 0,
                offset: 30,
                showLastLabel: true,
                labels: {
                    format: '{value:%H}'
                }
            }, { // Top X axis
                linkedTo: 0,
                type: 'datetime',
                tickInterval: 24 * 3600 * 1000,
                labels: {
                    format: '{value:<span style="font-size: 12px; font-weight: bold">%a</span> %b %e}',
                    align: 'left',
                    x: 3,
                    y: -5
                },
                opposite: true,
                tickLength: 20,
                gridLineWidth: 1
            }],
    
            yAxis: [{ // temperature axis
                title: {
                    text: null
                },
                labels: {
                    format: '{value}°',
                    style: {
                        fontSize: '10px'
                    },
                    x: -3
                },
                plotLines: [{ // zero plane
                    value: 0,
                    color: '#BBBBBB',
                    width: 1,
                    zIndex: 2
                }],
                // Custom positioner to provide even temperature ticks from top down
                tickPositioner: function () {
                    var max = Math.ceil(this.max) + 1,
                        pos = max - 12, // start
                        ret;
    
                    if (pos < this.min) {
                        ret = [];
                        while (pos <= max) {
                            ret.push(pos += 1);
                        }
                    } // else return undefined and go auto
    
                    return ret;
    
                },
                maxPadding: 0.3,
                tickInterval: 1,
                gridLineColor: (Highcharts.theme && Highcharts.theme.background2) || '#F0F0F0'
    
            }, { // precipitation axis
                title: {
                    text: null
                },
                labels: {
                    enabled: false
                },
                gridLineWidth: 0,
                tickLength: 0
    
            }, { // Air pressure
                allowDecimals: false,
                title: { // Title on top of axis
                    text: 'hPa',
                    offset: 0,
                    align: 'high',
                    rotation: 0,
                    style: {
                        fontSize: '10px',
                        color: Highcharts.getOptions().colors[2]
                    },
                    textAlign: 'left',
                    x: 3
                },
                labels: {
                    style: {
                        fontSize: '8px',
                        color: Highcharts.getOptions().colors[2]
                    },
                    y: 2,
                    x: 3
                },
                gridLineWidth: 0,
                opposite: true,
                showLastLabel: false
            }],
    
            legend: {
                enabled: false
            },
    
            plotOptions: {
                series: {
                    pointPlacement: 'between'
                }
            },
    
    
            series: [{
                name: 'Temperature',
                data: this.temperatures,
                type: 'spline',
                marker: {
                    enabled: false,
                    states: {
                        hover: {
                            enabled: true
                        }
                    }
                },
                tooltip: {
                    valueSuffix: '°C'
                },
                zIndex: 1,
                color: '#FF3333',
                negativeColor: '#48AFE8'
            }, {
                name: 'Air pressure',
                color: Highcharts.getOptions().colors[2],
                data: this.pressures,
                marker: {
                    enabled: false
                },
                shadow: false,
                tooltip: {
                    valueSuffix: ' hPa'
                },
                dashStyle: 'shortdot',
                yAxis: 2
            }]
        };
    };
    
    /**
     * Post-process the chart from the callback function, the second argument to Highcharts.Chart.
     */
    Meteogram.prototype.onChartLoad = function (chart) {
    
        this.drawWeatherSymbols(chart);
        this.drawWindArrows(chart);
        this.drawBlocksForWindArrows(chart);
    
    };
    
    /**
     * Create the chart. This function is called async when the data file is loaded and parsed.
     */
    Meteogram.prototype.createChart = function () {
        var meteogram = this;
        this.chart = new Highcharts.Chart(this.getChartOptions(), function (chart) {
            meteogram.onChartLoad(chart);
        });
    };
    
    Meteogram.prototype.parseYrData = function () {
        var meteogram = this,
            data = this.data,
            pointStart;
    
        if (!data || !data.list) {
            $('#loading').html('<i class="fa fa-frown-o"></i> Failed loading data, please try again later');
            return;
        }
    
        data.list.forEach(function (item, i) {
            if ((i + 1) === data.list.length) {
                return;
            }
            
            let from = item.dt * 1000;
            let to = data.list[i + 1].dt * 1000;
    
            if (to > pointStart + 4 * 24 * 36e5) {
                return;
            }
    
            // If it is more than an hour between points, show all symbols
            if (i === 0) {
                meteogram.resolution = to - from;
            }
    
            // Populate the parallel arrays
            meteogram.symbols.push(item.weather[0].icon); // eslint-disable-line dot-notation
            meteogram.symbolNames.push(item.weather[0].main);

            meteogram.temperatures.push({
                x: from,
                y: item.main.temp,
                // custom options used in the tooltip formatter
                to: to,
                index: i
            });

            meteogram.windDirections.push(parseFloat(item.wind.deg));
            meteogram.windSpeeds.push(item.wind.speed);
    
            meteogram.pressures.push({
                x: from,
                y: parseFloat(item.main.pressure)
            });
    
            if (i === 0) {
                pointStart = (from + to) / 2;
            }
        });
    
        // Smooth the line
        this.smoothLine(this.temperatures);
    
        // Create the chart when the data is loaded
        this.createChart();
    };
    // End of the Meteogram protype
    
    return Meteogram;
}]);