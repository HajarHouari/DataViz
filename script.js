// Chargement des données
d3.csv("data/ville_secu_informatique_centroide.csv").then(data => {
  // Nettoyage
  data = data.filter(d => d.Catégorie && d.Latitude && d.Longitude);

  // Créer les graphiques avec les données
  createBarChart(data);
  createPieChart(data);
  createMapChart(data);
  createServersChart(data);
});

/////////////////////////////
// Palette de couleurs pour les niveaux de sécurité (Graphique 1 et Carte)
/////////////////////////////
const securityColors = d3.scaleOrdinal()
  .range(["#d73027", "#fc8d59", "#fee08b", "#91cf60", "#1a9850"]);

/////////////////////////////
// Graphique 1 : Bar chart - Répartition par catégorie de sécurité avec légende
/////////////////////////////
function createBarChart(data) {
  // Calcul des effectifs par catégorie
  const counts = d3.rollups(data, v => v.length, d => d.Catégorie)
    .map(([categorie, count]) => ({ categorie, count }));

  // Récupérer la liste des catégories et définir le domaine de la palette
  const categories = counts.map(d => d.categorie);
  securityColors.domain(categories);

  const width = 800, height = 400, margin = { top: 20, right: 30, bottom: 50, left: 60 };

  const svg = d3.select("#barChart .viz").append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3.scaleBand()
    .domain(categories)
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(counts, d => d.count)]).nice()
    .range([height - margin.bottom, margin.top]);

  // Dessiner les barres
  svg.selectAll("rect")
    .data(counts)
    .enter().append("rect")
    .attr("x", d => x(d.categorie))
    .attr("y", d => y(d.count))
    .attr("width", x.bandwidth())
    .attr("height", d => height - margin.bottom - y(d.count))
    .attr("fill", d => securityColors(d.categorie))
    .on("mouseover", (event, d) => {
      d3.select(".tooltip")
        .style("display", "block")
        .html(`<strong>${d.categorie}</strong><br>${d.count} communes`)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 20}px`);
    })
    .on("mouseout", () => d3.select(".tooltip").style("display", "none"));

  // Axe X
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-15)")
    .style("text-anchor", "end");

  // Axe Y
  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // Création de la légende dans le conteneur approprié
  const legend = d3.select("#legend-bar");
  categories.forEach(cat => {
    const item = legend.append("div").attr("class", "legend-item");
    item.append("span")
        .attr("class", "legend-dot")
        .style("background-color", securityColors(cat));
    item.append("span")
        .attr("class", "legend-text")
        .text(cat);
  });
}

/////////////////////////////
// Graphique 2 : Camembert - Langages de programmation avec légende
/////////////////////////////
function createPieChart(data) {
  // Calcul des effectifs par langage
  const counts = d3.rollups(data, v => v.length, d => d.Langage)
    .map(([langage, count]) => ({ langage, count }));

  const width = 500, height = 400, radius = Math.min(width, height) / 2;
  
  // Palette prédéfinie pour les langages
  const languageColors = d3.scaleOrdinal()
    .domain(counts.map(d => d.langage))
    .range(["#3572A5", "#6f42c1", "#f1e05a", "#b07219", "#555555", "#e34c26"]);

  const svg = d3.select("#pieChart .viz").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

  const pie = d3.pie().value(d => d.count);
  const arc = d3.arc().innerRadius(0).outerRadius(radius - 10);

  const arcs = svg.selectAll(".arc")
    .data(pie(counts))
    .enter().append("g")
    .attr("class", "arc");

  arcs.append("path")
    .attr("d", arc)
    .attr("fill", d => languageColors(d.data.langage))
    .on("mouseover", (event, d) => {
      d3.select(".tooltip")
        .style("display", "block")
        .html(`${d.data.langage}: ${d.data.count}`)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 20}px`);
    })
    .on("mouseout", () => d3.select(".tooltip").style("display", "none"));

  // Création de la légende pour le camembert
  const legend = d3.select("#legend-pie");
  counts.forEach(d => {
    const item = legend.append("div").attr("class", "legend-item");
    item.append("span")
        .attr("class", "legend-dot")
        .style("background-color", languageColors(d.langage));
    item.append("span")
        .attr("class", "legend-text")
        .text(d.langage);
  });
}

/////////////////////////////
// Graphique 3 : Carte interactive - Utilisation des mêmes couleurs que le graphique 1 avec légende
/////////////////////////////
function createMapChart(data) {
  const width = 800, height = 450;

  const svg = d3.select("#mapChart .viz").append("svg")
    .attr("width", width)
    .attr("height", height);

  // Projection Mercator
  const projection = d3.geoMercator()
    .scale(2000)
    .center([2.5, 46.5])
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  // Dessiner un cercle pour chaque commune en fonction de sa catégorie
  svg.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => projection([+d.Longitude, +d.Latitude])[0])
    .attr("cy", d => projection([+d.Longitude, +d.Latitude])[1])
    .attr("r", 3)
    .attr("fill", d => securityColors(d.Catégorie))
    .attr("opacity", 0.6)
    .on("mouseover", (event, d) => {
      d3.select(".tooltip")
        .style("display", "block")
        .html(`<strong>${d.Commune}</strong><br>${d.Catégorie}`)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 20}px`);
    })
    .on("mouseout", () => d3.select(".tooltip").style("display", "none"));

  // Création de la légende pour la carte
  const legend = d3.select("#legend-map");
  // Utiliser le domaine des couleurs définies pour la sécurité
  securityColors.domain().forEach(cat => {
    const item = legend.append("div").attr("class", "legend-item");
    item.append("span")
        .attr("class", "legend-dot")
        .style("background-color", securityColors(cat));
    item.append("span")
        .attr("class", "legend-text")
        .text(cat);
  });
}

/////////////////////////////
// Graphique 4 : Barres horizontales pour serveurs web avec légende
/////////////////////////////
function createServersChart(data) {
  // Calcul global des occurrences pour chaque serveur
  const counts = d3.rollups(data, v => v.length, d => d.Serveur)
    .map(([serveur, count]) => ({ serveur, count }));

  // Trier par ordre décroissant
  counts.sort((a, b) => b.count - a.count);

  const width = 850, height = 400, margin = { top: 20, right: 30, bottom: 50, left: 150 };

  const svg = d3.select("#serversChart .viz").append("svg")
    .attr("width", width)
    .attr("height", height);

  // Echelle horizontale pour les effectifs
  const x = d3.scaleLinear()
    .domain([0, d3.max(counts, d => d.count)]).nice()
    .range([margin.left, width - margin.right]);

  // Echelle verticale pour les serveurs
  const y = d3.scaleBand()
    .domain(counts.map(d => d.serveur))
    .range([margin.top, height - margin.bottom])
    .padding(0.2);

  // Palette pour les serveurs (utilisation de d3.schemeTableau10)
  const serverColors = d3.scaleOrdinal(d3.schemeTableau10)
    .domain(counts.map(d => d.serveur));

  // Création des barres horizontales
  svg.selectAll("rect")
    .data(counts)
    .enter()
    .append("rect")
    .attr("x", margin.left)
    .attr("y", d => y(d.serveur))
    .attr("width", d => x(d.count) - margin.left)
    .attr("height", y.bandwidth())
    .attr("fill", d => serverColors(d.serveur))
    .append("title")
    .text(d => `${d.serveur}: ${d.count}`);

  // Axe horizontal
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  // Axe vertical
  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // Création de la légende pour les serveurs
  const legend = d3.select("#legend-servers");
  counts.forEach(d => {
    const item = legend.append("div").attr("class", "legend-item");
    item.append("span")
        .attr("class", "legend-dot")
        .style("background-color", serverColors(d.serveur));
    item.append("span")
        .attr("class", "legend-text")
        .text(d.serveur);
  });
}

/////////////////////////////
// Bouton "Remonter en haut"
/////////////////////////////
const scrollTopBtn = document.getElementById("scrollTopBtn");
window.onscroll = () => {
  if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
    scrollTopBtn.style.display = "block";
  } else {
    scrollTopBtn.style.display = "none";
  }
};

scrollTopBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});
