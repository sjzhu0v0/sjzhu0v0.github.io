const fs = require('fs');
const path = require('path');
const glob = require('glob');  // Require the glob module

// Get the JSON file path and output HTML file name from command-line arguments
const args = process.argv.slice(2); // Extract arguments starting from the 3rd item (index 2)
const jsonFilePath = args[0] || 'data.json';  // Default to 'data.json' if no argument is provided
const outputFileName = args[1] || 'output.html'; // Default to 'output.html' if no output name is provided

console.log(`Input JSON File Path: ${jsonFilePath}`);
console.log(`Output HTML File Name: ${outputFileName}`);

// Check if the JSON file exists
fs.exists(jsonFilePath, (exists) => {
  if (!exists) {
    console.error(`The JSON file "${jsonFilePath}" does not exist.`);
    return;
  }

  console.log(`Reading JSON file: ${jsonFilePath}`);

  // Read the external JSON file
  fs.readFile(jsonFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error("Error reading the JSON file:", err);
      return;
    }

    let num_files = 0;
    console.log("JSON file read successfully.");

    // Parse the JSON data
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (parseError) {
      console.error("Error parsing the JSON file:", parseError);
      return;
    }

    console.log("JSON data parsed successfully.");

    // Function to resolve wildcard pattern (e.g., 'image*.jpg')
    function resolveWildcardPattern(pattern) {
      return new Promise((resolve, reject) => {
        glob(pattern, (err, matches) => {
          if (err) {
            reject(err);
          } else {
            resolve(matches);
          }
        });
      });
    }

    // Function to generate HTML content from JSON data
    async function generateHTML(section, parentId, heading = '') {
      let newTitle = heading + section.title;
      let html = `
      <div class="section" id="${parentId}"><h2>${newTitle}</h2><p>${section.description.replace(/\n/g, '<br>')}</p>`;
      // Loop through content
      for (let item of section.content) {
        num_files++;
        // If item is a wildcard pattern (e.g., image*.jpg), resolve it
        if (item.includes('*')) {
          if (item.endsWith('.jpg')) {
            try {
              const resolvedFiles = await resolveWildcardPattern(item);
              resolvedFiles.forEach(file => {
                num_files++;
                html += `
                <img src="${file}" alt="${section.title} image">`;
              });
            } catch (err) {
              console.error(`Error resolving wildcard pattern "${item}":`, err);
            }
          }
          if (item.endsWith('.json')) {
            try {
              const resolvedFiles = await resolveWildcardPattern(item);
              resolvedFiles.forEach(file => {
                num_files++;
                let content_from_json = fs.readFileSync(file, 'utf8');
                html += `
          <div class="section" id="root_plot_${num_files}" position: relative">
          </div>
          <script>
            function display_root_plot_${num_files}(Core) {
              let obj = Core.parse(${content_from_json});
              Core.settings.HandleKeys = false;
              Core.draw("root_plot_${num_files}", obj, "");
            }

            function script_load_root_plot_${num_files}(src, on_error) {
              let script = document.createElement('script');
              script.src = src;
              script.onload = function () { display_root_plot_${num_files}(JSROOT); };
              script.onerror = function () { script.remove(); on_error(); };
              document.head.appendChild(script);
            }

            if (typeof requirejs !== 'undefined') {
              requirejs.config({
                paths: { 'JSRootCore': ['build/jsroot', 'https://root.cern/js/7.4.3/build/jsroot', 'https://jsroot.gsi.de/7.4.3/build/jsroot'] }
              })(['JSRootCore'], function (Core) {
                display_root_plot_${num_files}(Core);
              });
            } else if (typeof JSROOT !== 'undefined') {
              display_root_plot_${num_files}(JSROOT);
            } else {
              try {
                var base_url = JSON.parse(document.getElementById('jupyter-config-data').innerHTML).baseUrl;
              } catch (_) {
                var base_url = '/';
              }
              script_load_root_plot_${num_files}(base_url + 'static/build/jsroot.js', function () {
                console.error('Fail to load JSROOT locally, please check your jupyter_notebook_config.py file');
                script_load_root_plot_${num_files}('https://root.cern/js/7.4.3/build/jsroot.js', function () {
                  document.getElementById("root_plot_${num_files}").innerHTML = "Failed to load JSROOT";
                });
              });
            }
             </script>`;
              });
            } catch (err) {
              console.error(`Error resolving wildcard pattern "${item}":`, err);
            }
          }
        } else if (item.endsWith('.jpg')) {
          html += `<img src="${item}" alt="${section.title} image">`;
        } else if (item.endsWith('.json')) {
          let content_from_json = fs.readFileSync(item, 'utf8');
          html += `
          <div class="section" id="root_plot_${num_files}" position: relative">
          </div>
          <script>
            function display_root_plot_${num_files}(Core) {
              let obj = Core.parse(${content_from_json});
              Core.settings.HandleKeys = false;
              Core.draw("root_plot_${num_files}", obj, "");
            }

            function script_load_root_plot_${num_files}(src, on_error) {
              let script = document.createElement('script');
              script.src = src;
              script.onload = function () { display_root_plot_${num_files}(JSROOT); };
              script.onerror = function () { script.remove(); on_error(); };
              document.head.appendChild(script);
            }

            if (typeof requirejs !== 'undefined') {
              requirejs.config({
                paths: { 'JSRootCore': ['build/jsroot', 'https://root.cern/js/7.4.3/build/jsroot', 'https://jsroot.gsi.de/7.4.3/build/jsroot'] }
              })(['JSRootCore'], function (Core) {
                display_root_plot_${num_files}(Core);
              });
            } else if (typeof JSROOT !== 'undefined') {
              display_root_plot_${num_files}(JSROOT);
            } else {
              try {
                var base_url = JSON.parse(document.getElementById('jupyter-config-data').innerHTML).baseUrl;
              } catch (_) {
                var base_url = '/';
              }
              script_load_root_plot_${num_files}(base_url + 'static/build/jsroot.js', function () {
                console.error('Fail to load JSROOT locally, please check your jupyter_notebook_config.py file');
                script_load_root_plot_${num_files}('https://root.cern/js/7.4.3/build/jsroot.js', function () {
                  document.getElementById("root_plot_${num_files}").innerHTML = "Failed to load JSROOT";
                });
              });
            }
            </script>`;
        }
        else if (item.endsWith('.jpg')) {
          html += `<img src="${item}" alt="${section.title} image">`;
        }
        else if (item.endsWith('.pdf') || item.startsWith('http') && item.includes('.pdf')) {
          html += `
            <div style="margin: 20px 0;">
              <p>Embedded PDF: <a href="${item}" target="_blank">${item}</a></p>
              <embed src="${item}" width="800" height="600" type="application/pdf">
            </div>`;
        }
        else if (item.endsWith('.json')) {
          let content_from_json = fs.readFileSync(item, 'utf8');
          html += `...你的现有JSON处理逻辑...`;
        }

        else if (jsonData[item]) {
          html += `
          <details id="${item}"><summary>${jsonData[item].title}
          </summary>`;
          let newHeading = heading + '----';
          html += await generateHTML(jsonData[item], item, newHeading);
          html += `
          </details>`;
        }
      }

      html += `
      </div>`;
      return html;
    }

    function generateSidebar() {
      let sidebarHTML = `
        <div class="sidebar">
          <h3>Table of Contents</h3>
          <button onclick="expandAll()">Expand All</button>
          <button onclick="collapseAll()">Collapse All</button>
      `;

      function generateLinks(section, parentId, heading = '') {
        sidebarHTML += `<a href="#${parentId}">${heading}${section.title}</a>`;
        section.content.forEach(item => {
          if (item.endsWith('.jpg')) {
            return;
          }
          if (jsonData[item]) {
            sidebarHTML += `
            <details>
            <summary>${jsonData[item].title}</summary>`;
            headingNew = heading + '----';
            generateLinks(jsonData[item], item, headingNew);
            sidebarHTML += `
            </details>`;
          }
        });
      }

      generateLinks(jsonData.main, 'section1', '----');

      sidebarHTML += `
      </div>`;
      return sidebarHTML;
    }

    const sidebar = generateSidebar();
    generateHTML(jsonData.main, 'section1').then(htmlContent => {
      const finalHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${jsonData.main.title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: 1fr 400px;
      min-height: 100vh;
      background-color: #f9f9f9;
    }
    .sidebar { 
      grid-column: 2; 
      width: 400px; 
      position: fixed; 
      top: 0; 
      right: 0; 
      height: 100%; 
      background-color: #e0e0e0;  /* Changed to light gray */
      color: black;              /* Changed to black */
      padding-top: 20px; 
      text-align: left; 
    }
    .sidebar a { 
      display: block; 
      color: black;              /* Changed to black */
      padding: 10px; 
      text-decoration: none; 
      margin: 5px 0; 
      word-wrap: break-word; 
      overflow-wrap: anywhere;
    }
    .sidebar a:hover { 
      background-color: #d0d0d0; /* Lighter gray for hover */
      border-radius: 5px; 
    }
    .content { 
      grid-column: 1; 
      padding: 20px; 
      flex-grow: 1; 
      word-wrap: break-word; 
      overflow-wrap: anywhere; 
    }
    .content-section { 
      padding: 20px; 
      text-align: center; 
      word-wrap: break-word; 
      overflow-wrap: anywhere;
    }
    img { 
      max-width: 90%; 
      max-height: 500px; 
      border: 2px solid #ddd; 
      border-radius: 8px; 
      box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2); 
      margin-top: 20px; 
    }
    details { 
      margin-top: 10px; 
    }
    details img { 
      max-width: 80%; 
      max-height: 300px; 
      margin: 10px 0; 
    }
    .MathJax, .math { 
      color: #333; 
    }
  </style>
</head>
<body>

  ${sidebar}

  <div class="content">
    ${htmlContent}
  </div>

  <!-- MathJax Configuration -->
  <script>
    MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true,
        packages: {'[+]': ['ams', 'color', 'boldsymbol']}
      },
      loader: {load: ['[tex]/ams', '[tex]/color', '[tex]/boldsymbol']},
      options: {
        ignoreHtmlClass: 'tex2jax_ignore',
        processHtmlClass: 'tex2jax_process'
      }
    };
  </script>
  
  <!-- Load MathJax from CDN -->
  <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"></script>

  <script>
    // JavaScript to handle expand/collapse functionality
    function expandAll() {
      const detailsElements = document.querySelectorAll("details");
      detailsElements.forEach(detail => {
        detail.open = true;
      });
    }

    function collapseAll() {
      const detailsElements = document.querySelectorAll("details");
      detailsElements.forEach(detail => {
        detail.open = false;
      });
    }
  </script>

</body>
</html>
      `;

      const outputPath = path.join(__dirname, outputFileName);

      fs.writeFile(outputPath, finalHTML, 'utf8', (err) => {
        if (err) {
          console.error("Error writing the HTML file:", err);
        } else {
          console.log(`HTML file successfully created at ${outputFileName}`);
        }
      });
    }).catch((err) => {
      console.error("Error generating HTML content:", err);
    });
  });
});
