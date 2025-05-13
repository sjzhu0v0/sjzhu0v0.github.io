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
      <div class="section" id="${parentId}"><h2>${newTitle}</h2><p>${section.description}</p>`;

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
                // html += content_from_json;
                // html += `num_files: ` + num_files;
                html += `
          <div class="section" id="root_plot_` + num_files + `" position: relative">
          </div> 
          <script>
            function display_root_plot_` + num_files + `(Core) {
              let obj = Core.parse(` + content_from_json + `);
              Core.settings.HandleKeys = false;
              Core.draw("root_plot_` + num_files + `", obj, "");
            }

            function script_load_root_plot_` + num_files + `(src, on_error) {
              let script = document.createElement('script');
              script.src = src;
              script.onload = function () { display_root_plot_` + num_files + `(JSROOT); };
              script.onerror = function () { script.remove(); on_error(); };
              document.head.appendChild(script);
            }

            if (typeof requirejs !== 'undefined') {

              // We are in jupyter notebooks, use require.js which should be configured already
              requirejs.config({
                paths: { 'JSRootCore': ['build/jsroot', 'https://root.cern/js/7.4.3/build/jsroot', 'https://jsroot.gsi.de/7.4.3/build/jsroot'] }
              })(['JSRootCore'], function (Core) {
                display_root_plot_` + num_files + `(Core);
              });

            } else if (typeof JSROOT !== 'undefined') {

              // JSROOT already loaded, just use it
              display_root_plot_` + num_files + `(JSROOT);

            } else {

              // We are in jupyterlab without require.js, directly loading jsroot
              // Jupyterlab might be installed in a different base_url so we need to know it.
              try {
                var base_url = JSON.parse(document.getElementById('jupyter-config-data').innerHTML).baseUrl;
              } catch (_) {
                var base_url = '/';
              }

              // Try loading a local version of requirejs and fallback to cdn if not possible.
              script_load_root_plot_` + num_files + `(base_url + 'static/build/jsroot.js', function () {
                console.error('Fail to load JSROOT locally, please check your jupyter_notebook_config.py file');
                script_load_root_plot_` + num_files + `('https://root.cern/js/7.4.3/build/jsroot.js', function () {
                  document.getElementById("root_plot_` + num_files + `").innerHTML = "Failed to load JSROOT";
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
          // If item is an image, add an image tag
          html += `<img src="${item}" alt="${section.title} image">`;
        } else if (item.endsWith('.json')) {
          // read the content of the json file
          let content_from_json = fs.readFileSync(item, 'utf8');
          html += `
          <div class="section" id="root_plot_` + num_files + `" position: relative">
          </div> 
          <script>
            function display_root_plot_` + num_files + `(Core) {
              let obj = Core.parse(` + content_from_json + `);
              Core.settings.HandleKeys = false;
              Core.draw("root_plot_` + num_files + `", obj, "");
            }

            function script_load_root_plot_` + num_files + `(src, on_error) {
              let script = document.createElement('script');
              script.src = src;
              script.onload = function () { display_root_plot_` + num_files + `(JSROOT); };
              script.onerror = function () { script.remove(); on_error(); };
              document.head.appendChild(script);
            }

            if (typeof requirejs !== 'undefined') {

              // We are in jupyter notebooks, use require.js which should be configured already
              requirejs.config({
                paths: { 'JSRootCore': ['build/jsroot', 'https://root.cern/js/7.4.3/build/jsroot', 'https://jsroot.gsi.de/7.4.3/build/jsroot'] }
              })(['JSRootCore'], function (Core) {
                display_root_plot_` + num_files + `(Core);
              });

            } else if (typeof JSROOT !== 'undefined') {

              // JSROOT already loaded, just use it
              display_root_plot_` + num_files + `(JSROOT);

            } else {

              // We are in jupyterlab without require.js, directly loading jsroot
              // Jupyterlab might be installed in a different base_url so we need to know it.
              try {
                var base_url = JSON.parse(document.getElementById('jupyter-config-data').innerHTML).baseUrl;
              } catch (_) {
                var base_url = '/';
              }

              // Try loading a local version of requirejs and fallback to cdn if not possible.
              script_load_root_plot_` + num_files + `(base_url + 'static/build/jsroot.js', function () {
                console.error('Fail to load JSROOT locally, please check your jupyter_notebook_config.py file');
                script_load_root_plot_` + num_files + `('https://root.cern/js/7.4.3/build/jsroot.js', function () {
                  document.getElementById("root_plot_` + num_files + `").innerHTML = "Failed to load JSROOT";
                });
              });
            } 

            </script>`;
        }
        else if (jsonData[item]) {
          // If item is a nested section, process recursively
          html += `
          <details id="${item}"><summary>${jsonData[item].title}
          </summary>`;
          let newHeading = heading + '----';
          html += await generateHTML(jsonData[item], item, newHeading);  // Recursive call to generate content for nested sections
          html += `
          </details>`;
        }
      }

      html += `
      </div>`;
      return html;
    }

    // Function to generate the sidebar with links to sections
    function generateSidebar() {
      let sidebarHTML = `
        <div class="sidebar">
          <h3>Table of Contents</h3>
          <button onclick="expandAll()">Expand All</button>
          <button onclick="collapseAll()">Collapse All</button>
      `;

      // Loop through the main section and generate sidebar links
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
            generateLinks(jsonData[item], item, headingNew); // Recursive link generation
            sidebarHTML += `
            </details>`;
          }
        });
      }

      // Start with the main section
      generateLinks(jsonData.main, 'section1', '----');

      sidebarHTML += `
      </div>`;
      return sidebarHTML;
    }

    // Generate HTML content for the page
    const sidebar = generateSidebar();
    generateHTML(jsonData.main, 'section1').then(htmlContent => {
      // Create the final HTML page
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
    .sidebar { grid-column: 2; width: 400px; position: fixed; top: 0; right: 0; height: 100%; background-color: #333; color: white; padding-top: 20px; text-align: left; }
    .sidebar a { display: block; color: white; padding: 10px; text-decoration: none; margin: 5px 0; word-wrap: break-word; overflow-wrap: anywhere;}
    .sidebar a:hover { background-color: #575757; border-radius: 5px; }
    .content { grid-column: 1; padding: 20px; flex-grow: 1; word-wrap: break-word; overflow-wrap: anywhere; }
    .content-section { padding: 20px; text-align: center; word-wrap: break-word; overflow-wrap: anywhere;}
    img { max-width: 90%; max-height: 500px; border: 2px solid #ddd; border-radius: 8px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2); margin-top: 20px; }
    details { margin-top: 10px; }
    details img { max-width: 80%; max-height: 300px; margin: 10px 0; }
  </style>
</head>
<body>

  ${sidebar}

  <div class="content">
    ${htmlContent}
  </div>

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

      // Create the full path for the output file
      const outputPath = path.join(__dirname, outputFileName);

      // Write the HTML content to the output file
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
