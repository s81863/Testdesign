let currentIndex = 0;
let mapIndex;
let userGroup: 'A' | 'B';			// Variable für die Testgruppe 	

const now = new Date();
const formattedDate = `${now.getMonth() + 1}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;

const offset_min_y = 0.002;
const offset_max_y = 0.011;
const offset_min_x = 0.003;
const offset_max_x = 0.015;
const draw_range_y = 0.02;
const draw_range_x = 0.03;
const bound_range_y = 0.04;
const bound_range_x = 0.05;

// Liste der Panoramastandorte inklusive deren Index und Kartentyp für Gruppe A
const coordinates = [
  { idx: 1, lat: 52.5215231, lng: 13.4106509, mapType: 'roadmap' }, // Berlin ALexanderplatz (tutorial)
  { idx: 2, lat: 49.9859891, lng: 7.0935337, mapType: 'hybrid' }, // Kröv Weinberge (tutorial)
  { idx: 3, lat: 50.940571, lng: 6.9624213, mapType: 'roadmap' }, // Köln (Dom)
  { idx: 4, lat: 53.5421631, lng: 9.993536, mapType: 'hybrid' }, // Hamburg
  { idx: 5, lat: 52.0284624, lng: 13.8943828, mapType: 'roadmap' }, // Schlepzig (Brandenburg)
  { idx: 6, lat: 54.3167353, lng: 13.0911634, mapType: 'hybrid' }, // Stralsund (Innenstadt)
  { idx: 7, lat: 51.1301398, lng: 11.4160058, mapType: 'roadmap' }, // Gänsetalbrücke
  { idx: 8, lat: 50.1018994, lng: 7.139526, mapType: 'hybrid' }, // Zugang Calmont Klettersteig
  { idx: 9, lat: 52.8258756, lng: 7.6419842, mapType: 'roadmap' }, // Wald-Feld-Grenze
  { idx: 10, lat: 51.5604541, lng: 14.0600081, mapType: 'hybrid' } // Lausitzer Seenplatte
];

function getRandomOffsetX() {
  const isNegative = Math.random() < 0.5;

  const randomValue = Math.random()*(offset_max_x - offset_min_x) + offset_min_x;

  return isNegative ? -randomValue : randomValue;
};

function getRandomOffsetY() {
  const isNegative = Math.random() < 0.5;

  const randomValue = Math.random()*(offset_max_y - offset_min_y) + offset_min_y;

  return isNegative ? -randomValue : randomValue;
};

function getMapBound() {
  return mapCenterList.map(center => ({
    north: center.lat + bound_range_y,
    south: center.lat - bound_range_y,
    west: center.lng - bound_range_x,
    east: center.lng + bound_range_x
  }));
}

function getMapDraw() {
  return mapCenterList.map(center => ({
    north: center.lat + draw_range_y,
    south: center.lat - draw_range_y,
    west: center.lng - draw_range_x,
    east: center.lng + draw_range_x
  }));
}

function getPolygonFromDraw(bound: { north: number, south: number, west: number, east: number }) {
  return [
    { lat: bound.north, lng: bound.west }, 
    { lat: bound.north, lng: bound.east }, 
    { lat: bound.south, lng: bound.east }, 
    { lat: bound.south, lng: bound.west }, 
    { lat: bound.north, lng: bound.west } 
  ];
}

// Funktion um ein Array zufällig durcheinanderzumischen
function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const firstTwo = coordinates.slice(0, 2);   // Beispielpanoramen exkludieren
const lastEight = coordinates.slice(2);     // 8 Testpanoramen
shuffleArray(lastEight);                    // Zufällig durchmischen
let coordinates2 = firstTwo.concat(lastEight);  // Alle Panoramen wieder zusammenfügen.

// Kartenzentrum basierend auf den Koordinaten der Panoramen und einem Zufalssoffset bestimmen. 
const mapCenterList = coordinates2.map(coord => ({
  lat: coord.lat + getRandomOffsetY(),
  lng: coord.lng + getRandomOffsetX()
}));

// Funktion zum Umkehren des `mapType`
function reverseMapType(mapType: string): string {
  return mapType === 'roadmap' ? 'hybrid' : 'roadmap';
}

// Zufällige Einteilung in Gruppe A oder B
userGroup = Math.random() < 0.5 ? 'A' : 'B';

// Array für die Proband:in basierend auf der Gruppe
coordinates2 = userGroup === 'A' ? coordinates2 : coordinates2.map(coord => ({
  ...coord,
  mapType: reverseMapType(coord.mapType)
}));

let panorama: google.maps.StreetViewPanorama;
let map: google.maps.Map;
let currentMarker: google.maps.Marker | null = null;
// let markersData: string[] = ['ts_pano_loaded,ts_marker_set,index,lat,lng,distance,areaknowledge,landmark'];
let tsPanoLoaded: string;
let currentPanorama: google.maps.StreetViewPanorama | null = null;

// Interface for MarkerData
interface MarkerData {
  ts_pano_loaded: string;
  ts_marker_set: string;
  index: number;
  lat: number;
  lng: number;
  distance: number;
  areaknowledge: string;
  landmark: string;
};

let markersData: MarkerData[] = [];

function addMarkerData(tsPanoLoaded: string, timestamp: string, idx: number, lat: number, lng: number, distance: number, areaKnowledge: string, landmark: string) {
  const markerData: MarkerData = {
    ts_pano_loaded: tsPanoLoaded,
    ts_marker_set: timestamp,
    index: idx,
    lat: lat,
    lng: lng,
    distance: distance,
    areaknowledge: areaKnowledge,
    landmark: landmark
  };

  markersData.push(markerData);
};

function updateMarkerData(indexToUpdate: number, updatedAreaKnowledge: string, updatedLandmark: string) {
  const markerToUpdate = markersData.find(marker => marker.index === indexToUpdate);

  if (markerToUpdate) {
    markerToUpdate.areaknowledge = updatedAreaKnowledge;
    markerToUpdate.landmark = updatedLandmark;
  } else {
    console.error(`Marker with index ${indexToUpdate} not found.`);
  }
};

//Initializieren des Panoramas
function initPano(callback) {
  const { lat, lng } = coordinates2[currentIndex];
  
  panorama = new google.maps.StreetViewPanorama(
    document.getElementById("map"),
    {
      position: { lat, lng },			// Panorama-ID ist abhängig von currentIndex
      addressControlOptions: {
        position: google.maps.ControlPosition.BOTTOM_CENTER,
      },
      showRoadLabels: false,
      scrollwheel: true,
      disableDefaultUI: true,
      linksControl: false,
      clickToGo: false,
      keyboardShortcuts: false
    }
  );
	// Drehung des Panoramas einstellen (Könnte man mit einer entsprechenden Liste auch von currentIndex abhängig machen 
  panorama.setPov({
    heading: 30,
    zoom: 0,
    pitch: 0
  });

  tsPanoLoaded = new Date().toISOString(); // Timestamp für den Zeitpunkt, wo das Panorama geladen wurde.
  // Aktualisieren, wenn zum nächsten Panorama gewechselt wird
  panorama.addListener('pano_changed', () => {
    tsPanoLoaded = new Date().toISOString();
    //console.log(`Current Panorama ID: ${panorama.getPano()}`);
    //console.log(`Timestamp Panorama Loaded: ${tsPanoLoaded}`);
  });
  /**  Debugging
  panorama.addListener('status_changed', () => {
    if (panorama.getStatus() !== 'OK') {
      console.error(`Failed to load panorama ID: ${coordinates2[currentIndex]}`);
    }
  });*/

  mapIndex = 0;
  callback();
}

// Karte initialisieren
function initMap() {
  // Kartentyp ist abhängig von der Gruppe und dem momentanen Map Index
  let mapType;
  if (currentIndex <=1 ) {
    ({ mapType } = firstTwo[currentIndex]);
  }
  else {
    ({ mapType } = coordinates2[currentIndex]);
  } 
  map = new google.maps.Map(document.getElementById("google-map"), {
    center: mapCenterList[currentIndex],  				// Punkt auf den die Karte zentriert ist (abhängig von currentIndex)
	restriction: {
		latLngBounds: getMapBound()[currentIndex],  		// Kartengrenzen (ebenfalls abhängig von currentIndex)
		strictBounds: false,
	},
    zoom: 15,								// Zoomstufe (ggf. auch je nach Panorama anpassen)
    disableDefaultUI: true,
    clickableIcons: false,
    mapTypeId: mapType
  });
  // Marker durch Klicken auf die Karte hinzufügen
  map.addListener('click', (event: google.maps.MapMouseEvent) => {
    addMarker(event.latLng);
  });

  map.setOptions({
    gestureHandling: 'greedy',
    zoomControl: true,
  });

  const mapDraw = getMapDraw()[currentIndex];
  const coords = getPolygonFromDraw(mapDraw);
  const polygon = new google.maps.Polyline({
    path: coords,
    geodesic: true,
    strokeColor: "#FF0000",
    strokeOpacity: 0.8,
    strokeWeight: 2,
  });

  polygon.setMap(map);

  mapIndex++;
}

function addMarker(location: google.maps.LatLng | google.maps.LatLngLiteral) {
  const timestamp = new Date().toISOString();					// Zeitpunkt des Hinzufügens eines Markers
  const { idx } = coordinates2[currentIndex];						// Nummer des aktuellen Panoramas (+1 damit Start bei 1)
  const distance = google.maps.geometry.spherical.computeDistanceBetween(	
    new google.maps.LatLng(coordinates2[currentIndex]),
    location
  );
  
  // Begrenzung auf 1 Marker
  if (currentMarker) {
    currentMarker.setMap(null);
  }

  currentMarker = new google.maps.Marker({
    position: location,
    map: map,
    title: `Index: ${idx}, Time: ${timestamp}`
  });

  //console.log(`Marker added at index ${idx} with timestamp ${timestamp}`);
  //console.log(`Distance from panorama view: ${distance} meters`);
  //console.log(userGroup);

  // Daten für die Csv-Datei	
  // const markerData = `${tsPanoLoaded},${timestamp},${idx},${location.lat()},${location.lng()},${distance},`; 

  // Beispielpanorama exkludieren	
  if (currentIndex >= 2) {
    
    addMarkerData(tsPanoLoaded, timestamp, idx, location.lat(), location.lng(), distance, " ", " ");
    
    /**
    const existingMarkerIndex = markersData.findIndex(data => data.split(",")[2] === idx.toString());

    if (existingMarkerIndex !== -1) {
      markersData[existingMarkerIndex] = markerData;
    } else {
      markersData.push(markerData);
    } */
  }
  
}

// Zum nächsten Panorama wechseln
function changeView() {
  currentIndex = (currentIndex + 1) % coordinates2.length;
  panorama.setPosition(coordinates2[currentIndex]);
  initMap();
  if (currentIndex == 1) {
    document.getElementById('tutorial-step-4')!.style.display = 'none';
    document.getElementById('tutorial-step-5')!.style.display = 'block';
    document.getElementById('reload-panorama')!.style.display = 'block';
  }
  // Message 4 Sekunden anzeigen, dass der Test beginnt
  if (currentIndex == 2) {
    document.getElementById("panorama-message")!.style.display = 'block';
    setTimeout(function(){
      document.getElementById("panorama-message")!.style.display = 'none';
    }, 4000);
    console.log("Message should appear now")
  }

  if (currentMarker) {
    currentMarker.setMap(null);
    currentMarker = null;
  }
  
  document.getElementById("reload-panorama")!.addEventListener("click", () => {
    initPano(() => {
      // Callback to initMap after mapIndex is set
      initMap();
    });
  });

}

function submitMarker() {
  if (!currentMarker) {
    console.log('No marker set.');
    return;
  }

  showModal();
  
}



function toggleMapSize() {
  const mapContainer = document.getElementById("map-container");
  const expandButton = document.getElementById("expand-map-button");
  mapContainer.classList.toggle("expanded");

  if (mapContainer.classList.contains("expanded")) {
    expandButton.innerHTML = "&#8600;";
    document.getElementById("google-map").style.opacity = "1.0";
  } else {
    expandButton.innerHTML = "&#8598;";
    document.getElementById("google-map").style.opacity = "0.75";
  }

  google.maps.event.trigger(map, "resize");
}

// Wird ausgeführt, sobald der User auf Start geklickt hat
function startGame() {
  document.getElementById("start-message").style.display = "none";
  document.getElementById("map").style.display = "block";
  //document.getElementById("end-form").style.display = "block";
  //document.getElementById("map-container").style.display = "block";
  //document.getElementById("next-button").style.display = "block";

  
  initPano(() => {
    // Callback to initMap after mapIndex is set
    initMap();
  });
}


// Fenster für Frage nach Ortskenntnissen zeigen
function showModal() {
  const modal = document.getElementById("area-knowledge-modal");
  modal.style.display = "block";
  
  const okButton = document.getElementById("modal-ok-button") as HTMLButtonElement;
  const exitButton = document.getElementById("modal-exit-button") as HTMLButtonElement;
  okButton.disabled = true;

  const yesCheckbox = document.getElementById("checkbox-yes") as HTMLInputElement;
  const noCheckbox = document.getElementById("checkbox-no") as HTMLInputElement;

  yesCheckbox.addEventListener("change", () => handleCheckboxChange(yesCheckbox, noCheckbox));
  noCheckbox.addEventListener("change", () => handleCheckboxChange(noCheckbox, yesCheckbox));
  // Fenster schließen: resettet eventuell markierte Felder
  exitButton.addEventListener("click", () => {
    modal.style.display = "none";
	yesCheckbox.checked = false;
	noCheckbox.checked = false;
  });
}

// Uncheckt das jeweils andere Feld, wenn der User seine Meinung ändert
function handleCheckboxChange(changedCheckbox: HTMLInputElement, otherCheckbox: HTMLInputElement) {
  if (changedCheckbox.checked) {
    otherCheckbox.checked = false;
  }
  const okButton = document.getElementById("modal-ok-button") as HTMLButtonElement;
  okButton.disabled = !changedCheckbox.checked && !otherCheckbox.checked;
}

// Fenster schließen und Antwort den Daten für die CSV-Datei zufügen
function hideModal() {
  const yesCheckbox = document.getElementById("checkbox-yes") as HTMLInputElement;
  const noCheckbox = document.getElementById("checkbox-no") as HTMLInputElement;
  const landmarkInput = document.getElementById("landmark-input") as HTMLInputElement;
  
  // Ensure a selection is made
  if (!yesCheckbox.checked && !noCheckbox.checked) {
    alert("Please select an option before proceeding.");
    return;
  }

  const modal = document.getElementById("area-knowledge-modal");
  modal.style.display = "none";

  const areaKnowledge = yesCheckbox.checked ? 'yes' : 'no';
  const landmark = landmarkInput.value.trim();
  let currentIdxValue = coordinates2[currentIndex].idx;

  if (currentIndex >= 2) {
    updateMarkerData(currentIdxValue, areaKnowledge, landmark);
  }

  yesCheckbox.checked = false;
  noCheckbox.checked = false;
  landmarkInput.value = '';

  // If last panorama processed, show the form
  if (currentIndex === mapCenterList.length - 1) {
    document.getElementById("map")!.style.display = "none";
    document.getElementById("map-container")!.style.display = "none";
    document.getElementById("submit-button")!.style.display = "none";
    document.getElementById("reload-panorama")!.style.display = "none";
    
    // Function to get value if element exists
    const getValue = (selector: string) => {
      const element = document.querySelector(selector) as HTMLInputElement;
      return element ? element.value : null;
    };

    // Function to get values of checked checkboxes
    const getCheckedValues = (selector: string) => {
      const elements = Array.from(document.querySelectorAll(selector)) as HTMLInputElement[];
      return elements.map(el => el.value);
    };

    // Collect form data
    const test_key = getValue('#key-input');
    const age = getValue('#age-input');
    const gender = getValue('input[name="select-gender"]:checked');
    const states = getCheckedValues('input[name="checkboxes-state"]:checked');
    const urbanRural = getValue('input[name="question-urban-rural"]:checked');
    const geoStudy = getValue('input[name="question-study-progamme"]:checked');
    const studyDegree = getValue('input[name="question-study-degree"]:checked');
    const gmapsFrequency = getValue('input[name="question-gmaps1"]:checked');
    const mapType = getValue('input[name="question-gmaps2"]:checked');
    const otherMaps = getValue('input[name="question-other-maps"]:checked');
    const geoGuessr = getValue('input[name="question-geoguessr"]:checked');

    const data = {
      userGroup,
      test_key,
      age,
      gender,
      states,
      urbanRural,
      geoStudy,
      studyDegree,
      gmapsFrequency,
      mapType,
      otherMaps,
      geoGuessr,
      markersData
    };

    console.log("Form data:", data);

    // Sending JSON data to the server
    fetch('https://test-projekt-server.de:3000/saveSurveyData', {  // Ensure HTTPS
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    .then(response => {
      if (response.ok) {
        alert('Data saved successfully!');
      } else {
        alert('Failed to save data.');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error saving data.');
    });
    
    document.getElementById("finished-message")!.style.display = 'block';
    



  } else {
    changeView();
  }
}



function showTutorialStep(step: number) {
  const steps = document.querySelectorAll('.tutorial-popup');
  steps.forEach((el, index) => {
    el.style.display = (index === step) ? 'block' : 'none';
  });
}

function initTutorial() {

  let currentStep = 0;
  showTutorialStep(currentStep);

  document.getElementById('tutorial-next-1')!.onclick = () => {
    currentStep = 1;
	  document.getElementById("map-container").style.display = "block";     // Karte erst anzeigen, wenn User auf Weiter geklickt hat.
    showTutorialStep(currentStep);
  };

  document.getElementById('tutorial-next-2')!.onclick = () => {
    currentStep = 2;
	  document.getElementById("submit-button").style.display = "block";     // Same for the Submit Button
    showTutorialStep(currentStep);
  };

  document.getElementById('tutorial-next-3')!.onclick = () => {
    currentStep = 3;
    document.getElementById("modal-ok-button").style.display = "block";   // ... OK Button
    showTutorialStep(currentStep);
  };

  document.getElementById('tutorial-finish')!.onclick = () => {
    console.log('Finish clicked');
    document.getElementById('tutorial')!.style.display = 'none';
  };
}



document.getElementById('start-button')!.onclick = () => {
  document.getElementById('start-message')!.style.display = 'none';
  document.getElementById('end-form')!.style.display = 'block';
};

document.getElementById('bt-finish')!.onclick = () => {
  document.getElementById('end-form')!.style.display = 'none';
  document.getElementById('tutorial')!.style.display = 'block';
  startGame();
  initTutorial();
};




document.addEventListener("DOMContentLoaded", () => {
  
  const submitButton = document.getElementById("submit-button");
  if (submitButton) {
    submitButton.addEventListener("click", submitMarker);
  } else {
    console.error("Submit button not found");
  }

  const expandButton = document.getElementById("expand-map-button");
  if (expandButton) {
    expandButton.addEventListener("click", toggleMapSize);
  } else {
    console.error("Expand map button not found");
  }


  const startButton = document.getElementById("start-button");
  if (startButton) {
    startButton.addEventListener("click"); // wird startGame nicht zweimal gestartet? s.o.
  } else {
    console.error("Start button not found");
  }
  
  const finishButton = document.getElementById("bt-finish");
  if (finishButton) {
    finishButton.addEventListener("click", startGame); // wird startGame nicht zweimal gestartet? s.o.
  } else {
    console.error("Finish button not found");
  }



  const modalOkButton = document.getElementById("modal-ok-button");
  if (modalOkButton) {
    modalOkButton.addEventListener("click", hideModal);
  } else {
    console.error("Modal OK button not found");
  }
});

declare global {
  interface Window {
    initPano: () => void;
  }
}
window.initPano = initPano;

// Dieser Teil deaktiviert die Navigation mit den Pfeiltasten
window.addEventListener('keydown', (event) => {
  if (
    (
      event.key === 'ArrowUp' ||
      event.key === 'ArrowDown' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight' ||
      event.key === '+' ||
      event.key === '=' ||
      event.key === '_' ||
      event.key === '-'
    ) &&
    !event.metaKey &&
    !event.altKey &&
    !event.ctrlKey
  ) {
    event.stopPropagation();
  }
}, { capture: true });

window.addEventListener('load', () => {
  document.getElementById("submit-button").addEventListener("click", submitMarker);
  document.getElementById("expand-map-button").addEventListener("click", toggleMapSize);
  //document.getElementById("start-button").addEventListener("click", startGame);
  document.getElementById("modal-ok-button").addEventListener("click", hideModal);
});

export {};
