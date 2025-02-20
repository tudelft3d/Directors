let map;
let buildingsLayer = L.layerGroup();
let greenSpacesLayer = L.layerGroup();
let waterLayer = L.layerGroup();
let treesLayer = L.layerGroup();
let schoolsLayer; 
let drawnItems;
let drawControl;
let correctBounds; 
let ShopsLayer;
let hasZoomedToBounds = false;
let selectedBufferDistance = null;
let bufferLayer = L.layerGroup(); // Layer for buffer
let bufferDistanceModal = document.getElementById('bufferDistanceModal');
let bufferMessage = document.getElementById('bufferMessage');
let clues = {
    1: "Meester Ton werd voor het laatst gezien in een gebouw ongeveer 300 meter van de school. Kun jij uitvinden welk gebouw een school is? Gebruik de juiste kaartlaag (rechtsboven) en de juiste opdrachtknop uit de gereedschapskist (linksboven).",
    2: "Meester Ton werd gezien bij een gebouw ongeveer 300 meter van de school. Gebruik de knop 'Buffer Maken', kies de juiste afstand en klik op de school om een buffer te maken.",
    3: "Meester Ton werd gespot bij de cadeauwinkel. Gebruik de knop 'Filter Winkels' om winkels op de kaart te tonen en vind de cadeauwinkel!",
    4: "Geweldig, je bent een stapje dichterbij gekomen! De eigenaar van de cadeauwinkel heeft hem zien lopen richting een groot groen gebied vlakbij de cadeauwinkel. Gebruik 'Vind Dichtstbijzijnde Groene Gebieden' om de twee dichtstbijzijnde groene gebieden te vinden.",
    5: "Nu moet je uitzoeken welk van deze twee groene gebieden de meeste bomen heeft want daar is meester Ton geweest. Selecteer de juiste kaartlaag (rechtsboven). Gebruik daarna de tool 'Bomenteller' om de bomen in elk gebied te tellen.",
    6: "Bijna klaar! Nu je de bomen hebt geteld, open je de 'Bomen Quiz' en beantwoord je de vraag: Hoeveel bomen staan er in het groene gebied waar de meester is gezien?"
};

let clueStatus = {
    1: true,  // Clue 1 is unlocked by default
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
};


document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('loginForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const code = document.getElementById('code').value;
        const errorMessage = document.getElementById('errorMessage');

        // Define location for Delft with code 1593
        const locationMap = {
            '1593': { name: 'Delft', lat: 52.0116, lng: 4.3556 }
        };

        if (locationMap[code]) {
            // Clear and hide error message if code is correct
            errorMessage.textContent = '';
            errorMessage.style.display = 'none';
            
            // Initialize map with location for Delft
            initMap(locationMap[code].lat, locationMap[code].lng);
            document.getElementById('map').style.display = 'block';
            document.querySelector('.container').style.display = 'none';
            document.getElementById('clueSection').style.display = 'block';
            document.getElementById('toolbox').style.display = 'block';
            
            showTutorial();
        } else {
            // Show error message if code is incorrect
            errorMessage.textContent = 'Oeps! Probeer het opnieuw, detective!';
            errorMessage.style.display = 'block';
        }
    });
});

function showTutorial() {
    const tutorialSteps = [
        {
            id: 'tutorialStep1',
            title: "Stap 1: Laag In- en Uitschakelen",
            description: "Gebruik de Lagen-tab in de rechterbovenhoek om lagen in en uit te schakelen.",
            circleTarget: '.leaflet-control-layers', // Circle around layers control
            circleId: 'layersCircle',
            buttonId: 'nextStep1',
        },
        {
            id: 'tutorialStep2',
            title: "Stap 2: Gereedschapskist",
            description: "Gebruik de Gereedschapskist om de benodigde functies voor je taken uit te voeren.",
            circleTarget: '#toolbox', // Circle around toolbox
            circleId: 'toolboxCircle',
            buttonId: 'nextStep2',
        },
        {
            id: 'tutorialStep3',
            title: "Stap 3: Hints",
            description: "Lees de hints zorgvuldig in de Hintsectie en volg de instructies op.",
            circleTarget: '.clue-section', // Circle around clues section
            circleId: 'clueCircle',
            buttonId: 'endTutorialButton',
        },
    ];

    let currentStepIndex = 0;

    // Create tutorial modal
    const tutorialModal = document.createElement('div');
    tutorialModal.id = 'tutorialModal';
    tutorialModal.style.position = 'fixed';
    tutorialModal.style.top = '0';
    tutorialModal.style.left = '0';
    tutorialModal.style.width = '100vw';
    tutorialModal.style.height = '100vh';
    tutorialModal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    tutorialModal.style.display = 'flex';
    tutorialModal.style.justifyContent = 'center';
    tutorialModal.style.alignItems = 'center';
    tutorialModal.style.zIndex = '10000';
    document.body.appendChild(tutorialModal);

    function drawCircleAroundElement(selector, circleId) {
        const element = document.querySelector(selector);
        if (!element) return;

        const rect = element.getBoundingClientRect();

        // Create circle element
        const circle = document.createElement('div');
        circle.id = circleId;
        circle.style.position = 'absolute';
        circle.style.border = '3px solid #0073e6';
        circle.style.borderRadius = '50%';
        circle.style.width = `${rect.width + 20}px`;
        circle.style.height = `${rect.height + 20}px`;
        circle.style.left = `${rect.left - 10}px`;
        circle.style.top = `${rect.top - 10}px`;
        circle.style.pointerEvents = 'none';
        circle.style.zIndex = '9999';
        document.body.appendChild(circle);
    }

    function removeCircle(circleId) {
        const circle = document.getElementById(circleId);
        if (circle) circle.remove();
    }

    function renderStep() {
        // Clear existing content
        tutorialModal.innerHTML = '';

        const step = tutorialSteps[currentStepIndex];

        // Create content container
        const content = document.createElement('div');
        content.style.backgroundColor = 'white';
        content.style.padding = '20px';
        content.style.borderRadius = '10px';
        content.style.textAlign = 'center';
        content.style.boxShadow = '0px 4px 10px rgba(0, 0, 0, 0.3)';
        content.style.maxWidth = '400px';

        const title = document.createElement('h3');
        title.textContent = step.title;
        content.appendChild(title);

        const description = document.createElement('p');
        description.textContent = step.description;
        content.appendChild(description);

        const button = document.createElement('button');
        button.textContent = currentStepIndex < tutorialSteps.length - 1 ? 'Volgende' : 'Einde Tutorial';
        button.addEventListener('click', handleNextStep);
        content.appendChild(button);

        tutorialModal.appendChild(content);

        // Draw circle around the target element
        drawCircleAroundElement(step.circleTarget, step.circleId);
    }

    function handleNextStep() {
        const step = tutorialSteps[currentStepIndex];
        removeCircle(step.circleId);

        currentStepIndex++;
        if (currentStepIndex >= tutorialSteps.length) {
            closeTutorial();
        } else {
            renderStep();
        }
    }

    function closeTutorial() {
        const tutorialModal = document.getElementById('tutorialModal');
        if (tutorialModal) tutorialModal.remove();
        startPracticeMode()
    }

    // Start the tutorial
    renderStep();
}

function startPracticeMode() {
    const practiceSteps = [
        { id: 'intro', description: "Voltooi de oefeningen voordat je verder gaat met de puzzel.", buttonLabel: "Volgende" },
        { id: 'task1', description: "Toon de laag 'Groene Gebieden'", layersToCheck: ['Groene Gebieden'], buttonLabel: "Controleer" },
        { id: 'task2', description: "Toon de lagen 'Gebouwen' en 'Water'", layersToCheck: ['Gebouwen', 'Water'], buttonLabel: "Controleer" },
    ];

    let currentStepIndex = 0;

    const modal = document.getElementById('practiceTaskModal');
    const description = document.getElementById('practiceTaskDescription');
    const actionButton = document.getElementById('practiceNextButton');
    const skipButton = document.getElementById('practiceSkipButton'); // Reference to the new button
    const feedback = document.getElementById('practiceFeedback'); // Feedback section

    // Show modal and update the first step description
    modal.style.display = 'block';
    description.textContent = practiceSteps[currentStepIndex].description;
    actionButton.textContent = practiceSteps[currentStepIndex].buttonLabel;

    actionButton.addEventListener('click', function () {
        const currentStep = practiceSteps[currentStepIndex];

        if (currentStep.id === 'intro') {
            // Move to the first practice task
            currentStepIndex++;
            description.textContent = practiceSteps[currentStepIndex].description;
            actionButton.textContent = practiceSteps[currentStepIndex].buttonLabel;
            feedback.textContent = ""; // Clear feedback when moving to the next step
        } else {
            // Validate the practice task
            const selectedLayers = getSelectedLayers();
            const requiredLayers = currentStep.layersToCheck;
            const allLayersShown = requiredLayers.every(layer => selectedLayers.includes(layer));

            if (allLayersShown) {
                feedback.textContent = "Goed gedaan! Ga door naar de volgende oefening."; // Success feedback
                feedback.className = "feedback-success";
                currentStepIndex++;

                if (currentStepIndex < practiceSteps.length) {
                    // Move to the next task
                    description.textContent = practiceSteps[currentStepIndex].description;
                    actionButton.textContent = practiceSteps[currentStepIndex].buttonLabel;
                } else {
                    // Complete the practice
                    feedback.textContent = "Je hebt alle oefeningen voltooid! Je kunt nu doorgaan met de puzzel.";
                    feedback.className = "feedback-success";
                    setTimeout(() => {
                        modal.style.display = 'none';
                        feedback.textContent = ""; // Clear feedback after completing the practice
                    }, 3000); // Hide modal after 3 seconds
                }
            } else {
                feedback.textContent = "Nog niet correct! Zorg ervoor dat alle vereiste lagen zichtbaar zijn."; // Error feedback
                feedback.className = "feedback-error";
            }
        }
    });
  
    // Add event listener to the "Skip Practice" button
    skipButton.addEventListener('click', function handleSkipPractice() {
        modal.style.display = 'none'; // Close the practice modal
        console.log("Practice skipped. User can continue with the puzzle.");
    });
}

// Helper function to get currently visible layers
function getSelectedLayers() {
    const selectedLayers = [];

    if (map.hasLayer(buildingsLayer)) selectedLayers.push('Gebouwen');
    if (map.hasLayer(greenSpacesLayer)) selectedLayers.push('Groene Gebieden');
    if (map.hasLayer(waterLayer)) selectedLayers.push('Water');
    if (map.hasLayer(treesLayer)) selectedLayers.push('Bomen');

    return selectedLayers;
}

function initMap(lat, lng) {
    map = L.map('map', { zoomControl: false }).setView([lat, lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    L.marker([lat, lng]).addTo(map);

    // Fetch and add Delft GeoJSON layers
    fetchGeoJSON('https://raw.githubusercontent.com/mixalismix-dr/Directors/refs/heads/main/Keizerskroon/buildings.geojson', buildingsLayer, {
        color: '#ff7800', weight: 2, opacity: 1, fillOpacity: 0.2, fillColor: '#ff7800'
    });

    fetchGeoJSON('https://raw.githubusercontent.com/mixalismix-dr/Directors/refs/heads/main/Keizerskroon/green_space3.geojson', greenSpacesLayer, {
        color: '#00ff00', weight: 2, opacity: 1, fillOpacity: 0.2, fillColor: '#00ff00'
    });

    fetchGeoJSON('https://raw.githubusercontent.com/mixalismix-dr/Directors/refs/heads/main/Keizerskroon/water.geojson', waterLayer, {
        color: '#0000ff', weight: 2, opacity: 1, fillOpacity: 0.2, fillColor: '#0000ff'
    });
  
    fetchGeoJSON('https://raw.githubusercontent.com/mixalismix-dr/Directors/refs/heads/main/Keizerskroon/trees2.geojson', treesLayer, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, {
                radius: 6,               // Size of the circle marker
                fillColor: '#32CD32',    // Lime green fill
                color: '#006400',        // Dark green border
                weight: 1,               // Border thickness
                opacity: 1,
                fillOpacity: 0.8         // Transparency of the fill color
            });
        }
    });

    // Add the grid without showing it in the control
    fetchGeoJSON('https://raw.githubusercontent.com/mixalismix-dr/Directors/refs/heads/main/delft_new_grid.geojson', null, {
        color: '#1E90FF', weight: 3, opacity: 1, fillOpacity: 0.2, fillColor: '1E90FF'
    });

    // Define the correct bounds in WGS84 (lon, lat) based on RD New converted values
    correctBounds = [
        [52.01106096916104, 4.422754471047392], // Bottom-left (southwest corner)
        [51.99774482575294, 4.444944031251278]  // Top-right (northeast corner)
    ];

    // Add the event listener for map clicks to check bounds
    map.on('click', function(e) {
        handleMapClick(e.latlng);
    });

    const overlayMaps = {
        'Gebouwen': buildingsLayer,
        'Groene Gebieden': greenSpacesLayer,
        'Water': waterLayer,
        'Bomen': treesLayer,
    };
    L.control.layers(null, overlayMaps).addTo(map);

    map.invalidateSize();

    // Handle window resize to resize the map properly
    window.addEventListener('resize', function() {
        map.invalidateSize();
    });

    // Ensure the map is properly resized initially
    setTimeout(function() {
        map.invalidateSize();
    }, 0);
}

// Updated fetchGeoJSON function to set up tree click events after loading trees layer
function fetchGeoJSON(url, layerGroup, options = {}) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const geoJsonLayer = L.geoJSON(data, {
                style: function () { return options; },
                pointToLayer: options.pointToLayer || null
            });

            // Add GeoJSON layer to the specified layer group or map
            geoJsonLayer.addTo(layerGroup || map);

            // Set up click events if this is the trees layer
            if (layerGroup === treesLayer) {
                setupTreeClickEvents(geoJsonLayer);
            }
        });
}

// Function to handle click events and check if they are within the bounds
function handleMapClick(latlng) {
    const sw = L.latLng(correctBounds[0]);
    const ne = L.latLng(correctBounds[1]);
    const bounds = L.latLngBounds(sw, ne);

    // Check if the clicked point is within the correct bounds
    if (bounds.contains(latlng) && !hasZoomedToBounds) {
        map.fitBounds(bounds);
        showMessage("🎉  Goed gedaan! Je hebt in het juiste gebied geklikt! Ga nu naar de eerste hint onderaan het scherm (klik op nummer 1)");
        hasZoomedToBounds = true;
    } else if (!bounds.contains(latlng)){
        showMessage("Oeps! Probeer opnieuw, detective!");
    }
}

// Function to display messages to the user
function showMessage(text) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = text;
    messageElement.style.display = 'block';
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 10000);  // Hide the message after 3 seconds
}

document.addEventListener("DOMContentLoaded", () => {
    const clueButtons = document.querySelectorAll(".clue-btn");
    const clueDisplay = document.getElementById("clueDisplay");

    // Initialize clue buttons: unlock Clue 1, lock the rest
    clueButtons.forEach((button) => {
        const clueNumber = parseInt(button.getAttribute("data-clue"));
        if (clueNumber === 1) {
            unlockClue(clueNumber); // Clue 1 is unlocked by default
        } else {
            lockClue(button); // Lock other clues
        }
    });

    // Unlock Clue 2 when "Filter Scholen" button is clicked
    document.getElementById("filterSchoolsButton").addEventListener("click", () => {
        unlockClue(2); // Unlock Clue 2
    });

    // Function to lock a clue
    function lockClue(button) {
        button.classList.add("locked");
        button.disabled = true; // Disable button
        button.innerHTML = "🔒"; // Display lock icon
    }


    // Event listeners for clue buttons
    clueButtons.forEach((button) => {
        button.addEventListener("click", function () {
            // Prevent locked buttons from being clicked
            if (this.classList.contains("locked")) return;

            const clueNumber = this.getAttribute("data-clue");
            clueDisplay.textContent = clues[clueNumber];

            // Remove the active class from all clue buttons
            clueButtons.forEach((clueButton) => {
                clueButton.style.backgroundColor = "#0066cc"; // Reset color to original orange
            });

            // Set the clicked clue button to light green to indicate it's active
            this.style.backgroundColor = "#90EE90"; // Light green

            // Based on the current clue number, check the required action
            checkClueCompletion(clueNumber);
        });
    });
});

function unlockClue(clueNumber) {
    // Ensure the previous clue is unlocked before unlocking this one
    if (clueNumber > 1 && !clueStatus[clueNumber - 1]) {
        console.warn(`Clue ${clueNumber - 1} must be unlocked before unlocking Clue ${clueNumber}`);
        return; // Do nothing if the previous clue is not unlocked
    }

    const button = document.querySelector(`.clue-btn[data-clue="${clueNumber}"]`);
    if (button && !clueStatus[clueNumber]) {
        // Unlock the clue
        button.classList.remove("locked");
        button.classList.add("unlocked");
        button.disabled = false; // Enable button
        button.innerHTML = clueNumber; // Replace lock icon with the clue number
        clueStatus[clueNumber] = true; // Mark this clue as unlocked

        // Optional: Add unlock animation
        button.classList.add("unlock-animation");
        setTimeout(() => {
            button.classList.remove("unlock-animation");
        }, 1000);
    }
}

document.querySelectorAll('.clue-btn').forEach((button) => {
    button.addEventListener('click', function () {
        const clueNumber = parseInt(this.getAttribute('data-clue'));
        if (!clueStatus[clueNumber]) {
            console.warn(`Clue ${clueNumber} is locked.`);
            return; // Prevent locked clues from being accessed
        }

        // Display the clue
        document.getElementById('clueDisplay').textContent = clues[clueNumber];

        // Indicate the active clue
        document.querySelectorAll('.clue-btn').forEach((btn) => {
            btn.style.backgroundColor = '#0066cc'; // Reset to default
        });
        this.style.backgroundColor = '#90EE90'; // Highlight the active clue
    });
});



// Show or hide the buffer modal when the "Create Buffer" button is clicked
document.getElementById('createBufferButton').addEventListener('click', function () {
    const bufferModal = document.getElementById('bufferDistanceModal');
    console.log(bufferModal.style.display);
    // Check the current display style and toggle between 'block' and 'none'
    if (bufferModal.style.display === 'none' || bufferModal.style.display === '') {
        bufferModal.style.display = 'block';  // Show the modal
      console.log('here');
    } else {
        bufferModal.style.display = 'none';
    }
});


// Handle buffer selection logic
document.getElementById('bufferDistance').addEventListener('change', function () {
    const selectedValue = parseInt(this.value);  // Convert the selected value to an integer
    const bufferMessage = document.getElementById('bufferMessage');

    bufferMessage.textContent = "";  // Clear any previous messages
    bufferMessage.classList.remove('valid', 'invalid');

    if (selectedValue === 300) {
        // Correct distance
        bufferMessage.textContent = "Goed gedaan! Selecteer nu je school om er een buffer omheen te maken.";
        bufferMessage.classList.add('valid');
        selectedBufferDistance = selectedValue; // Set selectedBufferDistance to 100
    } else if (selectedValue === 100 || selectedValue === 200) {
        // Incorrect distance
        bufferMessage.textContent = "Jammer dit is de verkeerde afstand! Selecteer de juiste afstand.";
        bufferMessage.classList.add('invalid');
        selectedBufferDistance = null;  // Reset selectedBufferDistance if incorrect
    } else {
        bufferMessage.textContent = "";
        selectedBufferDistance = null;  // Reset selectedBufferDistance for any other input
    }
});

    // Show or hide the tree quiz modal when the "Tree Quiz" button is clicked
document.getElementById('treeQuizButton').addEventListener('click', function () {
  const treeQuizModal = document.getElementById('treeQuizModal');
  treeQuizModal.style.display = treeQuizModal.style.display === 'block' ? 'none' : 'block';
});

// Add event listeners to each tree count button
document.querySelectorAll('.tree-quiz-option').forEach(button => {
  button.addEventListener('click', function () {
    const selectedValue = parseInt(this.getAttribute('data-value'));
    checkTreeCount(selectedValue); // Check the selected answer
  });
});

function checkTreeCount(selectedCount) {
    const treeQuizMessage = document.getElementById('treeQuizMessage');

    // Clear previous message classes
    treeQuizMessage.classList.remove('success', 'warning');

    if (selectedCount === 7) {
        // Correct answer
        treeQuizMessage.textContent = "🎉 Gefeliciteerd! Je hebt de meester nu echt bijna gevonden. Pak je mobiel en navigeer naar de plek met de volgende coördinaten: 52.004444, 4.396111. TIP: gebruik “openstreetmap” of “google maps” op je telefoon om naar deze plek te gaan. LET OP de punten en komma moeten op de juiste plaats staan";
        treeQuizMessage.classList.add('success');
    } else {
        // Incorrect answer
        treeQuizMessage.textContent = "🤔 Jammer, nog een keer tellen! Hoeveel bomen waren er?";
        treeQuizMessage.classList.add('warning');

        // Set a timeout only for incorrect answers
        setTimeout(() => {
            treeQuizMessage.textContent = ''; // Clear message after 3 seconds
        }, 15000);
    }
}


document.addEventListener('DOMContentLoaded', function () {
    // Ensure the button click is bound after the DOM fully loads
    document.getElementById('filterSchoolsButton').addEventListener('click', function () {
        console.log("Filter Schools button clicked"); // Debugging output to confirm click
        filterSchools();
    });
});


// Modify the filterSchools function to include the success message
function filterSchools() {
    console.log("Filter Schools function started");

    // Remove previous school layer if it exists to avoid duplicate layers
    if (schoolsLayer) {
        map.removeLayer(schoolsLayer);
    }

    // Initialize a new layer group for schools
    schoolsLayer = L.layerGroup();

    fetch('https://raw.githubusercontent.com/mixalismix-dr/Directors/refs/heads/main/school1.geojson')
        .then(response => {
            if (!response.ok) {
                console.error('Error fetching the GeoJSON data:', response.statusText);
                return;
            }
            return response.json();
        })
        .then(data => {
            console.log("Fetched data:", data); // Debugging: confirms data retrieval
            L.geoJSON(data, {
                style: {
                    color: '#FFD700',  // Gold border color
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.7,
                    fillColor: '#FFEC8B'  // Light yellow fill color
                }
            }).addTo(schoolsLayer);

            // Add the layer to the map
            schoolsLayer.addTo(map);
      
            // Attach click event to each school feature to create buffer
            schoolsLayer.eachLayer(layer => {
                layer.on('click', function() {
                    createSchoolBuffer();
                });
            });

            // Display the success message for moving to the next hint
            displayHintMessage("Well done! Now go to hint 2");
        })
        .catch(error => {
            console.error('Error fetching or displaying schools GeoJSON data:', error);
        });
}


// Bind the clearMap function to the clearMapButton click event
document.getElementById('clearMapButton').addEventListener('click', function () {
    console.log("Clear Map button clicked"); // Debugging output
    clearMap();
});

// Function to clear all layers except the base map
function clearMap() {
    // Remove all layers except the base map layer
    if (map.hasLayer(buildingsLayer)) map.removeLayer(buildingsLayer);
    if (map.hasLayer(greenSpacesLayer)) map.removeLayer(greenSpacesLayer);
    if (map.hasLayer(waterLayer)) map.removeLayer(waterLayer);
    if (map.hasLayer(treesLayer)) map.removeLayer(treesLayer);
    if (map.hasLayer(schoolsLayer)) map.removeLayer(schoolsLayer);
    if (map.hasLayer(bufferLayer)) map.removeLayer(bufferLayer);
    if (map.hasLayer(ShopsLayer)) map.removeLayer(ShopsLayer);
}


function createSchoolBuffer() {
    if (selectedBufferDistance === 300) {
        bufferLayer.clearLayers(); // Clear existing buffer if any

        schoolsLayer.eachLayer(layer => {
            const buffered = turf.buffer(layer.toGeoJSON(), selectedBufferDistance / 1000, { units: 'kilometers' });
            L.geoJSON(buffered, {
                style: {
                    color: 'blue',
                    fillColor: 'lightblue',
                    fillOpacity: 0.5
                }
            }).addTo(bufferLayer);
        });

        // Add buffer layer to the map
        bufferLayer.addTo(map);
        selectedBufferDistance = null; // Reset after creating buffer
        unlockClue(3);
    } else {
        alert("Selecteer de juiste afstand voordat je een school selecteert.");
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Bind the click event for filtering shops
    document.getElementById('filterShopsButton').addEventListener('click', function () {
        console.log("Filter Shops button clicked"); // Debugging output
        filterShops();
    });
});

function filterShops() {
    console.log("Filter Shops function started");

    if (ShopsLayer) {
        map.removeLayer(ShopsLayer);
    }

    ShopsLayer = L.layerGroup();

    fetch('https://raw.githubusercontent.com/mixalismix-dr/Directors/refs/heads/main/Keizerskroon/shops.geojson')
        .then(response => {
            if (!response.ok) {
                console.error('Error fetching the GeoJSON data:', response.statusText);
                return;
            }
            return response.json();
        })
        .then(data => {
            L.geoJSON(data, {
                style: {
                    color: '#FF69B4',  // Pink border color
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.7,
                    fillColor: '#FFB6C1'  // Light pink fill color
                },
                onEachFeature: function (feature, layer) {
                    const osmId = feature.properties.osm_id;

                    let message;
                    let cssClass;

                    // Define custom messages and CSS classes based on osm_id
                    if (osmId === "257546957") {
                        message = "<div class='shop-popup supermarket'>Dit is een <strong>supermarkt</strong>. Zoek de cadeauwinkel!</div>";
                    } else if (osmId === "257547277") {
                        message = "<div class='shop-popup electronics'>Dit is een <strong>electronica winkel</strong>. Zoek de cadeauwinkel!</div>";
                    } else if (osmId === "257557501") {
                        message = "<div class='shop-popup electronics'>Dit is een <strong>electronica winkel</strong>. Zoek de cadeauwinkel!</div>";
                     } else if (osmId === "257545704") {
                        message = "<div class='shop-popup gift-shop'>Gefeliciteerd! <strong>Je hebt de cadeauwinkel gevonden!</strong> Ga nu naar de volgende hint (hint nummer 4)</div>";

                        // Attach event listener to unlock Clue 4 on click
                        layer.on('click', function () {
                            unlockClue(4);
                        });
                    }
                    // Bind the custom message with a CSS class to the popup
                    layer.bindPopup(message, { className: 'custom-popup' });

                    // Open the popup when the shop is clicked
                    layer.on('click', function () {
                        layer.openPopup();
                      
                    setTimeout(() => {
                        map.closePopup(layer.getPopup());
                    }, 5000);

                    });
                }
            }).addTo(ShopsLayer);

            ShopsLayer.addTo(map);
        })
        .catch(error => {
            console.error('Error fetching or displaying gift shops GeoJSON data:', error);
        });
}


let correctSelectionCount = 0;
const targetOsmIds = [4000, 9000]; // IDs for the two correct green areas

function onGreenSpaceFeature(feature, layer) {
    const osmId = feature.properties.osm_id;

    // Attach click event listener to each green area layer
    layer.on('click', function () {
        // Check if the clicked area is one of the correct ones and hasn't been selected already
        if (targetOsmIds.includes(osmId) && !layer._selected) {
            correctSelectionCount++;
            layer._selected = true; // Mark the layer as selected to prevent duplicate clicks

            let message;
            if (correctSelectionCount < 2) {
                // Show progress message
                message = `<div class='green-space-popup progress'>🎉 ${correctSelectionCount}/2 gebieden gevonden. Blijf zoeken!</div>`;
                showMessageWithClass(message);          
            } else if (correctSelectionCount === 2) {
                // Show congratulations message when both areas are found
                message = `<div class='green-space-popup congratulations'>🎉 Gefeliciteerd! Je hebt beide groene gebieden in de buurt van de cadeauwinkel gevonden! Ga nu naar de volgende hint (hint nummer 5)</div>`;
                showMessageWithClass(message);
                unlockClue(5); 
                
                // Reset selection for future interactions
                correctSelectionCount = 0;
                resetGreenAreaSelection(); // Reset the selected state on all areas
            }
        } else if (!targetOsmIds.includes(osmId)) {
            // Feedback for incorrect selection
            let message = `<div class='green-space-popup warning'>🤔 Weet je zeker dat dit het juiste gebied is?</div>`;
            showMessageWithClass(message);
        }
    });
}

// Function to show messages with specific styles
function showMessageWithClass(htmlContent) {
    // Remove any existing message first to prevent duplicates
    document.querySelectorAll('.green-space-popup').forEach(message => message.remove());


    // Create new message
    const messageElement = document.createElement('div');
    messageElement.innerHTML = htmlContent;
    messageElement.classList.add('green-space-popup');
    messageElement.style.position = 'fixed';
    messageElement.style.top = '50%';
    messageElement.style.left = '50%';
    messageElement.style.transform = 'translate(-50%, -50%)';
    messageElement.style.zIndex = '9999';

    document.body.appendChild(messageElement);

    setTimeout(() => {
        messageElement.remove(); // Remove the message after 10 seconds
    }, 5000); // Adjust timing as needed
}


// Function to reset selected state on green areas
function resetGreenAreaSelection() {
    greenSpacesLayer.eachLayer(layer => {
        layer._selected = false; // Reset selected state on all green area layers
    });
}

// Function to enable and display green spaces layer with selection
function filterGreenSpaces() {
    console.log("Filter Green Spaces function started");

    // Remove previous greenSpacesLayer if it exists
    if (greenSpacesLayer) {
        map.removeLayer(greenSpacesLayer);
    }

    // Initialize new layer group for green spaces
    greenSpacesLayer = L.layerGroup();

    // Fetch the GeoJSON data for green spaces
    fetch('https://raw.githubusercontent.com/mixalismix-dr/Directors/refs/heads/main/Keizerskroon/green_space3.geojson')
        .then(response => {
            if (!response.ok) {
                console.error('Error fetching the GeoJSON data:', response.statusText);
                return;
            }
            return response.json();
        })
        .then(data => {
            // Add GeoJSON data to greenSpacesLayer with onGreenSpaceFeature as the callback
            L.geoJSON(data, {
                style: {
                    color: '#00ff00',  // Green border color
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.7,
                    fillColor: '#90EE90'  // Light green fill color
                },
                onEachFeature: onGreenSpaceFeature // Attach the click event handler for selection
            }).addTo(greenSpacesLayer);

            // Add greenSpacesLayer to the map
            greenSpacesLayer.addTo(map);
        })
        .catch(error => {
            console.error('Error fetching or displaying green spaces GeoJSON data:', error);
        });
}


// Function to reset selection on all green areas
function resetGreenAreaSelection() {
    greenSpacesLayer.eachLayer(layer => {
        layer._selected = false; // Reset selection status
    });
}

// Utility function to show messages to the user
function showMessage(text) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = text;
    messageElement.style.display = 'block';
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 1500); // Message disappears after 3 seconds
}

// Enable the feature on button click
document.getElementById('findGreenAreasButton').addEventListener('click', function () {
    filterGreenSpaces(); // Call the function to enable green spaces layer and feature click functionality
});


// Define global variables for tree counter and highlighted trees
let treeClickCounter = 0;
let highlightedTrees = []; // Array to store highlighted trees

// Event listener for the "Tree Counter" button
document.getElementById('TreeCounterButton').addEventListener('click', function () {
    // Toggle visibility of treesLayer
    if (map.hasLayer(treesLayer)) {
        map.removeLayer(treesLayer); // Remove layer if it's already on the map
        document.getElementById('counterSection').style.display = 'none'; // Hide counter section
    } else {
        map.addLayer(treesLayer); // Add layer if it's not on the map
        document.getElementById('counterSection').style.display = 'block'; // Show counter section
        unlockClue(6);
    }
});

document.getElementById('resetCounterButton').addEventListener('click', resetCounter);

// Function to increment the tree counter
function incrementCounter() {
    treeClickCounter++;
    document.getElementById('treeCounter').textContent = treeClickCounter;
}

function resetCounter() {
    // Reset counter to zero and update display
    treeClickCounter = 0;
    document.getElementById('treeCounter').textContent = treeClickCounter;

    // Unhighlight all previously highlighted trees
    unhighlightAllTrees();
}

function highlightTree(layer) {

    // Apply new style to the clicked tree only
    layer.setStyle({
        color: "#FFD700",  // Gold border
        fillColor: "#FFD700", // Gold fill
        weight: 3,  // Thicker border
        radius: 6  // Larger size
    });
    highlightedTrees.push(layer); // Add to highlighted trees array
}

function unhighlightAllTrees() {
    highlightedTrees.forEach(layer => {
        layer.setStyle({
            color: "#006400",  // Original dark green border
            fillColor: "#32CD32", // Original lime green fill
            weight: 1,  // Original border weight
            radius: 4  // Original radius
        });
    });
    
    // Clear the highlighted trees array
    highlightedTrees = [];
}

function setupTreeClickEvents(geoJsonLayer) {
    geoJsonLayer.eachLayer(layer => {
        layer.on('click', function (e) {
            highlightTree(layer); // Highlight tree on click
            incrementCounter(); // Increment the counter
            e.originalEvent.stopPropagation(); // Prevents map click propagation
        });
    });
}

// Call this function after treesLayer is loaded with GeoJSON data
setupTreeClickEvents();





