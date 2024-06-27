import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';


const Dashboard = () => {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({   topic: '',  sector: '',  region: '',  endYear: '',  pest: '',  source: '',  swot: '',  country: '',  city: ''  });
  const [filterOptions, setFilterOptions] = useState({topics: [], sectors: [], regions: [], endYears: [],pests: [], sources: [], swots: [], countries: [],cities: []  });

  const svgRefs = {
    sectors: useRef(),
    topics: useRef(),
    countries: useRef(),
    relevance: useRef(),
    intensityOverTime: useRef(),
    frequencySources: useRef(),
    sectorDistribution: useRef(),
    pestDistribution: useRef(),
    endYearDistribution: useRef(),
    impactLikelihood: useRef(),
    relevanceIntensity: useRef(),
    relevanceByCountry: useRef(),
  };



  const handleMouseEnter = (e) => {
    const charts = document.querySelectorAll('.chart');
    charts.forEach(chart => {
      if (chart !== e.currentTarget) {
        chart.classList.add('blur');
      } else {
        chart.classList.add('expanded');
      }
    });
  };

  const handleMouseLeave = () => {
    const charts = document.querySelectorAll('.chart');
    charts.forEach(chart => {
      chart.classList.remove('blur');
      chart.classList.remove('expanded');
    });
  };
  const uniqueValues = (key) => {
    return [...new Set(data.map(item => item[key]))].filter(Boolean);
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = 'https://visualization-backend-9xvh.onrender.com/api/data';
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`API request failed with status code: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched data:', data); // Debugging line
        setData(data);
        const topics = Array.from(new Set(data.map(item => item.topic)));
        const sectors = Array.from(new Set(data.map(item => item.sector)));
        const regions = Array.from(new Set(data.map(item => item.region)));
        const endYears = Array.from(new Set(data.map(item => item.end_year)));
        const pests = Array.from(new Set(data.map(item => item.pestle)));
        const sources = Array.from(new Set(data.map(item => item.source)));
        const swots = Array.from(new Set(data.map(item => item.swot)));
        const countries = Array.from(new Set(data.map(item => item.country)));
        const cities = Array.from(new Set(data.map(item => item.city)));

        setFilterOptions({ topics, sectors, regions, endYears, pests, sources, swots, countries, cities });
       } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);


  useEffect(() => {
    console.log('Filters:', filters);
    if (data.length > 0) {
      renderCharts();
    }
  }, [data, filters]);
 const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const renderCharts = () => {
    const filteredData = data.filter(item => {
      return (!filters.topic || item.topic === filters.topic) &&
             (!filters.sector || item.sector === filters.sector) &&
             (!filters.region || item.region === filters.region) &&
             (!filters.endYear || item.end_year === parseInt(filters.endYear)) &&
             (!filters.pest || item.pestle === filters.pest) &&
             (!filters.source || item.source === filters.source) &&
             (!filters.swot || item.swot === filters.swot) &&
             (!filters.country || item.country === filters.country) &&
             (!filters.city || item.city === filters.city);
    });

    console.log('Filtered data:', filteredData); // Debugging line

    renderIntensityBySector(filteredData);
    renderIntensityByTopic(filteredData);
    renderImpactByCountry(filteredData);
    renderRelevanceDistribution(filteredData);
    renderIntensityOverTime(filteredData);
    renderFrequencyOfSources(filteredData);
    renderSectorDistribution(filteredData);
    renderPestDistribution(filteredData);
    renderEndYearDistribution(filteredData);
    renderRelevanceVsIntensity(filteredData);
    renderRelevanceByCountry(filteredData);
  };

  const renderRelevanceByCountry = (filteredData) => {
    // Roll up and calculate average relevance by country
    let data = d3.rollups(filteredData, v => d3.mean(v, d => d.relevance), d => d.country);
    
    // Sort by relevance and take top 10 countries
    data = data.sort((a, b) => d3.descending(a[1], b[1])).slice(0, 10);
  
    const svg = d3.select(svgRefs.relevanceByCountry.current);
    svg.selectAll('*').remove(); // Clear previous chart
  
    const margin = { top: 20, right: 10, bottom: 100, left: 50 };
    const width = 400 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
  
    const x = d3.scaleBand().domain(data.map(d => d[0])).range([0, width]).padding(0.1);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d[1])]).nice().range([height, 0]);
  
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  
    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d[0]))
      .attr('y', d => y(d[1]))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d[1]))
      .attr('fill', 'mediumseagreen');
  
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');
  
    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y));
  };
  
  
  const renderFrequencyOfSources = (filteredData) => {
    const data = d3.rollups(filteredData, v => v.length, d => d.source)
                   .sort((a, b) => d3.descending(a[1], b[1])) // Sort by frequency descending
                   .slice(0, 10); // Get top 10 entries

    const svg = d3.select(svgRefs.frequencySources.current);
    svg.selectAll('*').remove(); // Clear previous chart

    const margin = { top: 20, right: 20, bottom: 100, left: 30 }; // Increase bottom margin for rotated labels
    const width = 400 - margin.left - margin.right;
    const height = 460 - margin.top - margin.bottom;

    const x = d3.scaleBand().domain(data.map(d => d[0])).range([0, width]).padding(0.1);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d[1])]).nice().range([height, 0]);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g')
      .selectAll('rect')
      .data(data)
      .enter().append('rect')
      .attr('x', d => x(d[0]))
      .attr('y', d => y(d[1]))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d[1]))
      .attr('fill', 'steelblue');

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text') // Select all x-axis labels
      .attr('transform', 'rotate(-45)') // Rotate labels 90 degrees counter-clockwise
      .style('text-anchor', 'end') // Align text to the end
      .attr('dx', '-.8em') // Adjust horizontal position
      .attr('dy', '.15em'); // Adjust vertical position

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y));
};

const renderSectorDistribution = (filteredData) => {
  // Replace empty sector values with "Others"
  const adjustedData = filteredData.map(d => ({
    ...d,
    sector: d.sector ? d.sector : "Others"
  }));

  // Roll up data by sector and sort by count
  const data = d3.rollups(adjustedData, v => v.length, d => d.sector)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Keep only the top 5 sectors

  const svg = d3.select(svgRefs.sectorDistribution.current);
  svg.selectAll('*').remove(); // Clear previous chart

  const width = 400;
  const height = 400;
  const radius = Math.min(width, height) / 2;
  const innerRadius = radius * 0.5; // Inner radius for the donut chart

  const arc = d3.arc().outerRadius(radius - 10).innerRadius(innerRadius);
  const pie = d3.pie().sort(null).value(d => d[1]);

  const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);

  const color = d3.scaleOrdinal(d3.schemeCategory10);

  const arcs = g.selectAll('.arc')
    .data(pie(data))
    .enter().append('g')
    .attr('class', 'arc');

  arcs.append('path')
    .attr('d', arc)
    .attr('fill', d => color(d.data[0]));

  // Add legends in the center of the donut chart
  const legend = g.append('g')
    .attr('class', 'legend')
    .attr('transform', 'translate(0,0)');

  legend.selectAll('text')
    .data(data)
    .enter().append('text')
    .attr('y', (d, i) => i * 20 - (data.length * 10)) // Adjust vertical positioning
    .attr('text-anchor', 'middle')
    .attr('fill', d => color(d[0]))
    .text(d => `${d[0]}: ${d[1]}`);

  // function midAngle(d) {
  //   return d.startAngle + (d.endAngle - d.startAngle) / 2;
  // }
};

const renderPestDistribution = (filteredData) => {
  // Replace empty pestle values with "Others"
  const adjustedData = filteredData.map(d => ({
    ...d,
    pestle: d.pestle ? d.pestle : "Others"
  }));

  // Roll up data by pestle and sort by count
  const data = d3.rollups(adjustedData, v => v.length, d => d.pestle)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Keep only the top 5 pestles

  const svg = d3.select(svgRefs.pestDistribution.current);
  svg.selectAll('*').remove(); // Clear previous chart

  const width = 400;
  const height = 400;
  const radius = Math.min(width, height) / 2;
  const innerRadius = radius * 0.5; // Inner radius for the donut chart

  const arc = d3.arc().outerRadius(radius - 10).innerRadius(innerRadius);
  const pie = d3.pie().sort(null).value(d => d[1]);

  const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);

  const color = d3.scaleOrdinal(d3.schemeCategory10);

  const arcs = g.selectAll('.arc')
    .data(pie(data))
    .enter().append('g')
    .attr('class', 'arc');

  arcs.append('path')
    .attr('d', arc)
    .attr('fill', d => color(d.data[0]));

  // Add legends in the center of the donut chart
  const legend = g.append('g')
    .attr('class', 'legend')
    .attr('transform', 'translate(0,0)');

  legend.selectAll('text')
    .data(data)
    .enter().append('text')
    .attr('y', (d, i) => i * 20 - (data.length * 10)) // Adjust vertical positioning
    .attr('text-anchor', 'middle')
    .attr('fill', d => color(d[0]))
    .text(d => `${d[0]}: ${d[1]}`);

  // function midAngle(d) {
  //   return d.startAngle + (d.endAngle - d.startAngle) / 2;
  // }
};

const renderEndYearDistribution = (filteredData) => {
  // Roll up and sort data
  let data = d3.rollups(filteredData, v => v.length, d => d.end_year)
    .sort((a, b) => a[0] - b[0]); // Sort by year

  // Limit to top 20 years
  data = data.slice(0, 20);

  const svg = d3.select(svgRefs.endYearDistribution.current);
  svg.selectAll('*').remove(); // Clear previous chart

  const margin = { top: 20, right: 20, bottom: 30, left: 50 }; // Increased bottom margin for rotation
  const width = 420 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const x = d3.scaleBand().domain(data.map(d => d[0])).range([0, width]).padding(0.1);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d[1])]).nice().range([height, 0]);

  const line = d3.line()
    .x(d => x(d[0]))
    .y(d => y(d[1]))
    .curve(d3.curveMonotoneX); // Curve for smoother lines

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  // Draw the line
  g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 1.5)
    .attr('d', line);

  // Draw the points
  g.selectAll('.dot')
    .data(data)
    .enter().append('circle')
    .attr('class', 'dot')
    .attr('cx', d => x(d[0]))
    .attr('cy', d => y(d[1]))
    .attr('r', 3)
    .attr('fill', 'steelblue');

  // Append x-axis and rotate text
  g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end")
   

    // svg.append('g')
    // .attr('class', 'x-axis')
    // .attr('transform', `translate(0,${height})`)
    // .call(d3.axisBottom(x))
    // .selectAll("text")
    // .attr("transform", "rotate(-45)")
    // .style("text-anchor", "");

  // Append y-axis
  g.append('g')
    .attr('class', 'y-axis')
    .call(d3.axisLeft(y));
};

  const renderRelevanceVsIntensity = (filteredData) => {
    const svg = d3.select(svgRefs.relevanceIntensity.current);
    svg.selectAll('*').remove(); // Clear previous chart

    const margin = { top: 20, right: 20, bottom: 30, left: 25 };
    const width = 420 - margin.left - margin.right;
    const height = 410 - margin.top - margin.bottom;

    const x = d3.scaleLinear().domain(d3.extent(filteredData, d => d.intensity)).range([0, width]);
    const y = d3.scaleLinear().domain(d3.extent(filteredData, d => d.relevance)).range([height, 0]);
    const r = d3.scaleSqrt().domain(d3.extent(filteredData, d => d.impact)).range([5, 20]);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y));

    g.selectAll('.dot')
      .data(filteredData)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.intensity))
      .attr('cy', d => y(d.relevance))
      .attr('r', d => r(d.impact))
      .attr('fill', 'salmon');
  };

  const renderIntensityBySector = (filteredData) => {
    // Clear the previous chart
    d3.select(svgRefs.sectors.current).selectAll('*').remove();

    const aggregatedData = d3.rollup(
      filteredData,
      v => d3.sum(v, d => d.intensity),
      d => d.sector
    );
    // const dataArr = Array.from(aggregatedData, ([sector, intensity]) => ({ sector, intensity }));
    const dataArr = Array.from(aggregatedData, ([sector, intensity]) => ({sector, intensity }))
    .sort((a, b) => d3.descending(a.intensity, b.intensity))
    .slice(0, 10); 

    const margin = { top: 20, right: 0, bottom: 90, left: 45 };
    const width = 400 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(svgRefs.sectors.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(dataArr.map(d => d.sector))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(dataArr, d => d.intensity)])
      .nice()
      .range([height, 0]);

    svg.append('g')
      .selectAll('.bar')
      .data(dataArr)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.sector))
      .attr('y', d => y(d.intensity))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.intensity))
      .attr('fill', 'green');

    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y));
  };

  const renderIntensityByTopic = (filteredData) => {
    d3.select(svgRefs.topics.current).selectAll('*').remove();

    const aggregatedData = d3.rollup(
      filteredData,
      v => d3.sum(v, d => d.intensity),
      d => d.topic
    );
    const dataArr = Array.from(aggregatedData, ([topic, intensity]) => ({ topic, intensity }))
    .sort((a, b) => d3.descending(a.intensity, b.intensity))
    .slice(0, 10); 

    const margin = { top: 20, right: 5, bottom: 80, left: 45 };
    const width = 420 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(svgRefs.topics.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(dataArr.map(d => d.topic))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(dataArr, d => d.intensity)])
      .nice()
      .range([height, 0]);

    svg.append('g')
      .selectAll('.bar')
      .data(dataArr)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.topic))
      .attr('y', d => y(d.intensity))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.intensity))
      .attr('fill', 'blue');

    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y));
  };

  const renderImpactByCountry = (filteredData) => {
    d3.select(svgRefs.countries.current).selectAll('*').remove();

    const aggregatedData = d3.rollup(
      filteredData,
      v => d3.sum(v, d => d.impact),
      d => d.country
    );
    const dataArr = Array.from(aggregatedData, ([country, impact]) => ({ country, impact }))
    .filter(d => d.impact > 0);

    const margin = { top: 20, right: 5, bottom: 90, left: 50 };
    const width = 390 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(svgRefs.countries.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(dataArr.map(d => d.country))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(dataArr, d => d.impact)])
      .nice()
      .range([height, 0]);

    svg.append('g')
      .selectAll('.bar')
      .data(dataArr)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.country))
      .attr('y', d => y(d.impact))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.impact))
      .attr('fill', 'purple');

    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y));
  };

  const renderRelevanceDistribution = (filteredData) => {
    d3.select(svgRefs.relevance.current).selectAll('*').remove();

    const relevanceData = filteredData.map(d => d.relevance);

    const margin = { top: 20, right: 20, bottom: 40, left: 20 };
    const width = 420 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(svgRefs.relevance.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain([0, d3.max(relevanceData)])
      .range([0, width]);

    const histogram = d3.histogram()
      .domain(x.domain())
      .thresholds(x.ticks(20))(relevanceData);

    const y = d3.scaleLinear()
      .domain([0, d3.max(histogram, d => d.length)])
      .range([height, 0]);

    const bar = svg.selectAll('.bar')
      .data(histogram)
      .enter()
      .append('g')
      .attr('class', 'bar')
      .attr('transform', d => `translate(${x(d.x0)},${y(d.length)})`);

    bar.append('rect')
      .attr('x', 1)
      .attr('width', x(histogram[0].x1) - x(histogram[0].x0) - 1)
      .attr('height', d => height - y(d.length))
      .attr('fill', 'orange');

    bar.append('text')
      .attr('dy', '.75em')
      .attr('y', -12)
      .attr('x', (x(histogram[0].x1) - x(histogram[0].x0)) / 2)
      .attr('text-anchor', 'middle')
      .text(d => d.length);

    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y));
  };

  const renderIntensityOverTime = (filteredData) => {
    d3.select(svgRefs.intensityOverTime.current).selectAll('*').remove();

    const aggregatedData = d3.rollup(
      filteredData,
      v => d3.sum(v, d => d.intensity),
      d => d.end_year
    );
    const dataArr = Array.from(aggregatedData, ([year, intensity]) => ({ year, intensity }));

    const margin = { top: 20, right: 30, bottom: 40, left: 35 };
    const width = 450 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(svgRefs.intensityOverTime.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(dataArr.map(d => d.year))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(dataArr, d => d.intensity)])
      .nice()
      .range([height, 0]);

    svg.append('g')
      .selectAll('.bar')
      .data(dataArr)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.year))
      .attr('y', d => y(d.intensity))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.intensity))
      .attr('fill', 'red');

    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y));
  };

  return (
    <div>
      <h1>Visualization Dashboard</h1>

      <style>{`

       h1 {
    text-align: center;
    color: #333;
    font-family: 'Arial', sans-serif;
    font-size: 2.5rem;
    margin-top: 2rem;
    margin-bottom: 1rem;
  }

  .filter-container {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 2rem;
    padding: 1rem;
    // border: 1px solid black;
 background: rgb(238,174,202);
background: linear-gradient(90deg, rgba(238,174,202,1) 0%, rgba(148,187,233,0.5215336134453781) 100%);
    
border-radius: 8px;
      box-shadow: 4px 4px 10px #74a4e7;
    position: relative;
    max-width: calc(100% - 4rem); /* Adjusts the width to fit within the viewport with extra margin */
    margin-left: 3rem; /* Adds margin to the left */
    margin-right: 3rem; /* Adds margin to the right */
  }
  .filter-container label {
    display: flex;
    flex-direction: column;
    font-weight: bold;
    color: #333;
    margin-right: 1rem;
  }
  .filter-container select {
    padding: 0.3rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
    color: #555;
    transition: border-color 0.3s, box-shadow 0.3s;
    background-color: #fff;
  }
  .filter-container select:focus {
    border-color: #007BFF;
    box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
    outline: none;
  }
  .filter-container select:hover {
    border-color: #007BFF;
  }
`}</style>



      <div className="filter-container">
        <label>
          Topic:
          <select name="topic" value={filters.topic} onChange={handleFilterChange}>
            <option value="">All</option>
            {filterOptions.topics.map((topic, index) => (
              <option key={index} value={topic}>{topic}</option>
            ))}
          </select>
        </label>
        <label>
          Sector:
          <select name="sector" value={filters.sector} onChange={handleFilterChange}>
            <option value="">All</option>
            {filterOptions.sectors.map((sector, index) => (
              <option key={index} value={sector}>{sector}</option>
            ))}
          </select>
        </label>
        <label>
          Region:
          <select name="region" value={filters.region} onChange={handleFilterChange}>
            <option value="">All</option>
            {filterOptions.regions.map((region, index) => (
              <option key={index} value={region}>{region}</option>
            ))}
          </select>
        </label>
        <label>
          End Year:
          <select name="endYear" value={filters.endYear} onChange={handleFilterChange}>
            <option value="">All</option>
            {filterOptions.endYears.map((endYear, index) => (
              <option key={index} value={endYear}>{endYear}</option>
            ))}
          </select>
        </label>
        <label>
          PEST:
          <select name="pest" value={filters.pest} onChange={handleFilterChange}>
            <option value="">All</option>
            {filterOptions.pests.map((pest, index) => (
              <option key={index} value={pest}>{pest}</option>
            ))}
          </select>
        </label>
        
        <label>
          SWOT:
          <select name="swot" value={filters.swot} onChange={handleFilterChange}>
            <option value="">All</option>
            {filterOptions.swots.map((swot, index) => (
              <option key={index} value={swot}>{swot}</option>
            ))}
          </select>
        </label>
        <label>
          Country:
          <select name="country" value={filters.country} onChange={handleFilterChange}>
            <option value="">All</option>
            {filterOptions.countries.map((country, index) => (
              <option key={index} value={country}>{country}</option>
            ))}
          </select>
        </label>
        <label>
          City:
          <select name="city" value={filters.city} onChange={handleFilterChange}>
            <option value="">All</option>
            {filterOptions.cities.map((city, index) => (
              <option key={index} value={city}>{city}</option>
            ))}
          </select>
        </label>
        <label>
          Source:
          <select name="source" value={filters.source} onChange={handleFilterChange}>
            <option value="">All</option>
            {filterOptions.sources.map((source, index) => (
              <option key={index} value={source}>{source}</option>
            ))}
          </select>
        </label>
      </div>



<div className="chart-container">
  <div className="chart" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
    <h2>Intensity by Sector</h2>
    <svg ref={svgRefs.sectors} width="100" height="500"></svg>
  </div>
  <div className="chart" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
    <h2>Top 10 Intensity by Topic</h2>
    <svg ref={svgRefs.topics}></svg>
  </div>
  <div className="chart" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
    <h2>Most Impacted Countries</h2>
    <svg ref={svgRefs.countries}></svg>
  </div>
  <div className="chart" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
    <h2>Relevance vs. Intensity</h2>
    <svg ref={svgRefs.relevanceIntensity} width="600" height="400"></svg>
  </div>
  <div className="chart"onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
    <h2>Relevance by Country</h2>
    <svg ref={svgRefs.relevanceByCountry} width="400" height="400"></svg>
  </div>
  <div className="chart"onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
    <h2>Relevance Distribution</h2>
    <svg ref={svgRefs.relevance}></svg>
  </div>
  <div className="chart"onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
    <h2>Intensity over Time</h2>
    <svg ref={svgRefs.intensityOverTime}></svg>
  </div>
  <div className="chart large-chart"onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
    <h2>Top 10 Frequency of Sources</h2>
    <svg ref={svgRefs.frequencySources} width="450" height="500"></svg>
  </div>
  <div className="chart large-chart"onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
    <h2>Sector Distribution</h2>
    <svg ref={svgRefs.sectorDistribution} width="450" height="400"></svg>
  </div>
  <div className="chart"onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
    <h2>PEST Analysis Distribution</h2>
    <svg ref={svgRefs.pestDistribution} width="450" height="400"></svg>
  </div>
  <div className="chart"onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
    <h2>End Year Distribution</h2>
    <svg ref={svgRefs.endYearDistribution} width="500" height="400"></svg>
  </div>
  
</div>

<style>{`
  .chart-container {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: center;
    padding: 0 2rem;
  }
  .chart {
    margin: 10px;
    padding: 10px;
    background-color: #f9f9f9;
    // border: 1px solid black;
    border-radius: 8px;
        box-shadow: 4px 4px 10px #74a4e7;
    flex: 1 1 calc(33.33% - 2rem); /* Flex-grow, flex-shrink, flex-basis */
    max-width: calc(33.33% - 2rem); 
    box-sizing: border-box;
transition: transform 0.3s, background-color 0.3s, filter 0.3s, z-index 0.3s;
  }
    .chart:hover{
    background-color: whitesmoke; /* Light blue background on hover */
    transform: scale(1.1);
    
    }

    .chart.blur {
    filter: blur(5px);
}
//     .chart.expanded {
//   position: fixed;
//   top: 50%;
//   left: 50%;
//   transform: translate(-50%, -50%) scale(1.5);
//   z-index: 10;
//   width: 50%;
//   height: auto;
// }

  .chart.large-chart {
    flex: 1 1 calc(66.66% - 2rem); /* Adjusts for larger charts */
    // max-width: calc(66.66% - 2rem);
  }
  .chart h2 {
    text-align: center;
    color: #333;
    font-family: 'Arial', sans-serif;
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
  h1 {
    text-align: center;
    color: #333;
    font-family: 'Arial', sans-serif;
    font-size: 2.5rem;
    margin-top: 2rem;
    margin-bottom: 1rem;
  }
`}</style>




    </div>
  );
};

export default Dashboard;