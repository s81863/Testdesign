import { saveAs } from 'file-saver';

let currentIndex = 0;
let mapIndex;

const offset_min_y = 0.002;
const offset_max_y = 0.009;
const offset_min_x = 0.003;
const offset_max_x = 0.013;
const bound_range_y = 0.02;
const bound_range_x = 0.03;

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

// Liste der Koordinaten, auf die die Karten zunächst zentriert sein sollen.
const mapCenterList = [
  { lat: 52.5215231 + getRandomOffsetY(), lng: 13.4106509 + getRandomOffsetX()}, // Berlin ALexanderplatz (tutorial)
  { lat: 49.9859891 + getRandomOffsetY(), lng: 7.0935337 + getRandomOffsetX()}, // Kröv Weinberge (tutorial)
  { lat: 50.940571 + getRandomOffsetY(), lng: 6.9624213 + getRandomOffsetX() }, // Köln (Dom)
  { lat: 53.5421631 + getRandomOffsetY(), lng: 9.993536 + getRandomOffsetX() }, // Hamburg
  { lat: 52.0284624 + getRandomOffsetY(), lng: 13.8943828 + getRandomOffsetX() }, // Schlepzig (Brandenburg)
  { lat: 54.3167353 + getRandomOffsetY(), lng: 13.0911634 + getRandomOffsetX() }, // Stralsund (Innenstadt)
  { lat: 51.1301398 + getRandomOffsetY(), lng: 11.4160058 + getRandomOffsetX() }, // Gänsetalbrücke
  { lat: 50.1018994 + getRandomOffsetY(), lng: 7.139526 + getRandomOffsetX() }, // Zugang Calmont Klettersteig
  { lat: 52.8258756 + getRandomOffsetY(), lng: 7.6419842 + getRandomOffsetX() }, // Wald-Feld-Grenze
  { lat: 51.5604541 + getRandomOffsetY(), lng: 14.0600081 + getRandomOffsetX() } // Lausitzer Seenplatte
];


function getMapBound() {
  return mapCenterList.map(center => ({
    north: center.lat + bound_range_y,
    south: center.lat - bound_range_y,
    west: center.lng - bound_range_x,
    east: center.lng + bound_range_x
  }));
}

function getPolygonFromBound(bound: { north: number, south: number, west: number, east: number }) {
  return [
    { lat: bound.north, lng: bound.west }, 
    { lat: bound.north, lng: bound.east }, 
    { lat: bound.south, lng: bound.east }, 
    { lat: bound.south, lng: bound.west }, 
    { lat: bound.north, lng: bound.west } 
  ];
}


let userGroup: 'A' | 'B';			// Variable für die Testgruppe 	
// Konstanten um die Google map auf einen anderen Typ zu stellen
const standardMapType = 'roadmap';              
const hybridMapType = 'hybrid';

// Liste der Panoramen
const coordinates = [
  { lat: 52.5215231, lng: 13.4106509}, // Berlin ALexanderplatz (tutorial)
  { lat: 49.9859891, lng: 7.0935337}, // Kröv Weinberge (tutorial)
  { lat: 50.940571, lng: 6.9624213 }, // Köln (Dom)
  { lat: 53.5421631, lng: 9.993536 }, // Hamburg
  { lat: 52.0284624, lng: 13.8943828 }, // Schlepzig (Brandenburg)
  { lat: 54.3167353, lng: 13.0911634 }, // Stralsund (Innenstadt)
  { lat: 51.1301398, lng: 11.4160058 }, // Gänsetalbrücke
  { lat: 50.1018994, lng: 7.139526 }, // Zugang Calmont Klettersteig
  { lat: 52.8258756, lng: 7.6419842 }, // Wald-Feld-Grenze
  { lat: 51.5604541, lng: 14.0600081 } // Lausitzer Seenplatte
];

// Diese Konstante wird nur für das Tutorial gebraucht
const fixedMapCenter = { lat: 52.5194748, lng: 13.3842489 };

let panorama: google.maps.StreetViewPanorama;
let map: google.maps.Map;
let currentMarker: google.maps.Marker | null = null;
let markersData: string[] = ['ts_pano_loaded,ts_marker_set,index,lat,lng,distance,areaknowledge'];
let tsPanoLoaded: string;

//Initializieren des Panoramas
function initPano(callback) {
  panorama = new google.maps.StreetViewPanorama(
    document.getElementById("map"),
    {
      position: coordinates[currentIndex],			// Panorama-ID ist abhängig von currentIndex
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
    console.log(`Current Panorama ID: ${panorama.getPano()}`);
    console.log(`Timestamp Panorama Loaded: ${tsPanoLoaded}`);
  });
  // Debugging
  panorama.addListener('status_changed', () => {
    if (panorama.getStatus() !== 'OK') {
      console.error(`Failed to load panorama ID: ${coordinates[currentIndex]}`);
    }
  });

  mapIndex = 0;
  callback();
}

// Karte initialisieren
function initMap() {
  // Kartentyp ist abhängig von der Gruppe und dem momentanen Map Index
  const mapType = (userGroup === 'A' && mapIndex % 2 === 0) || (userGroup === 'B' && mapIndex % 2 !== 0) ? standardMapType : hybridMapType;    
  console.log(userGroup, mapIndex ); 
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

  const mapBounds = getMapBound()[currentIndex];
  const coords = getPolygonFromBound(mapBounds);
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
  const panoIndex = currentIndex + 1;						// Nummer des aktuellen Panoramas (+1 damit Start bei 1)
  const distance = google.maps.geometry.spherical.computeDistanceBetween(	
    new google.maps.LatLng(coordinates[currentIndex]),
    location
  );
  
  // Begrenzung auf 1 Marker
  if (currentMarker) {
    currentMarker.setMap(null);
  }

  currentMarker = new google.maps.Marker({
    position: location,
    map: map,
    title: `Index: ${panoIndex}, Time: ${timestamp}`
  });

  console.log(`Marker added at index ${panoIndex} with timestamp ${timestamp}`);
  console.log(`Distance from panorama view: ${distance} meters`);

  // Daten für die Csv-Datei	
  const markerData = `${tsPanoLoaded},${timestamp},${panoIndex},${location.lat()},${location.lng()},${distance},`; 

  // Beispielpanorama exkludieren	
  if (currentIndex !== 0) {
    const existingMarkerIndex = markersData.findIndex(data => data.split(",")[2] === panoIndex.toString());

    if (existingMarkerIndex !== -1) {
      markersData[existingMarkerIndex] = markerData;
    } else {
      markersData.push(markerData);
    }
  }
  
}

// Zum nächsten Panorama wechseln
function changeView() {
  currentIndex = (currentIndex + 1) % coordinates.length;
  panorama.setPosition(coordinates[currentIndex]);
  initMap();
  if (currentIndex == 1) {
    document.getElementById('tutorial-step-4')!.style.display = 'none';
    document.getElementById('tutorial-step-5')!.style.display = 'block';
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

}

function submitMarker() {
  if (!currentMarker) {
    console.log('No marker set.');
    return;
  }

  if (markersData.length > 1 || currentIndex === 0) {
    showModal();
  } else {
    console.log('No markers to submit.');
  }
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
  userGroup = Math.random() < 0.5 ? 'A' : 'B';
  document.getElementById("start-message").style.display = "none";
  document.getElementById("map").style.display = "block";
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
  // Es muss eine Antwort ausgewählt sein
  if (!yesCheckbox.checked && !noCheckbox.checked) {
    alert("Please select an option before proceeding.");
    return;
  }

  const modal = document.getElementById("area-knowledge-modal");
  modal.style.display = "none";

  const areaKnowledge = yesCheckbox.checked ? 'yes' : 'no';

  if (currentIndex !== 0) {
    markersData[markersData.length - 1] += areaKnowledge;
  }

  yesCheckbox.checked = false;
  noCheckbox.checked = false;
  // Wenn das letzte Panorama bearbeitet wurde
  if (currentIndex === mapCenterList.length - 1) {
    const csvContent = markersData.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const now = new Date();
    const formattedDate = `${now.getMonth() + 1}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
    const fileName = `data_${userGroup}_${formattedDate}.csv`;
    saveAs(blob, fileName);

    document.getElementById("finished-message").style.display = "block";
    document.getElementById("map").style.display = "none";
    document.getElementById("map-container").style.display = "none";
    //document.getElementById("next-button").style.display = "none";
    document.getElementById("submit-button").style.display = "none";
  } else {
    changeView();  							// Ansonsten zum nächsten Panorama gehen
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

function showPanoramaMessage() {
  
}

document.getElementById('start-button')!.onclick = () => {
  document.getElementById('start-message')!.style.display = 'none';
  document.getElementById('tutorial')!.style.display = 'block';
  startGame();
  initTutorial();
};




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
