import { saveAs } from 'file-saver';

let currentIndex = 0;
let mapIndex;

// Liste der Koordinaten, auf die die Karten zunächst zentriert sein sollen.
const mapCenterList = [
  {lat: 52.5214119, lng: 13.4071451},	
  { lat: 50.0968306, lng: 7.1398799 }, // Bereits auf den Standort zentriert
  { lat: 54.2349728, lng: 9.0930605 }, // Bereits auf den Standort zentriert
  { lat: 52.5164116, lng: 13.3794872 },
  { lat: 52.5090565, lng: 13.3766477 },
  { lat: 52.5054908, lng: 13.3341694 },
  { lat: 52.5049535, lng: 13.2795553 },
  { lat: 52.5145766, lng: 13.2368277 },
  { lat: 52.544155, lng: 13.3534112 }
];

// Liste der Kartengrenzen: Definiert die Maximale Ausdehnung der Karte in Nord-,Süd-,West- und Ostrichtung
const mapBoundList = [
 {north: 52.52474700402667,
 south: 52.5160037125997,
 west: 13.395073993266973,
 east: 13.425542404237454},
 {north: 50.124091880676104,
 south: 50.0743414485289,
 west: 7.076158718181713,
 east: 7.191487769936919},
 {north: 54.25470793542802,
 south: 54.22125044166433,
 west: 9.038729714655673,
 east: 9.124903724902042}
 /*
 {north: xx,
 south: xx,
 west: xx,
 east: xx},
 {north: xx,
 south: xx,
 west: xx,
 east: xx},
 {north: xx,
 south: xx,
 west: xx,
 east: xx},
 {north: xx,
 south: xx,
 west: xx,
 east: xx},
 {north: xx,
 south: xx,
 west: xx,
 east: xx},
 {north: xx,
 south: xx,
 west: xx,
 east: xx}
 */
]

let userGroup: 'A' | 'B';				
const standardMapType = 'roadmap';
const hybridMapType = 'hybrid';

// Liste der Panoramen
const panoramaIds = [
'8Qbx2O5-RZpDBN5ToxMvUQ',								//Tutorial Panorama
'AF1QipPuRXrm2MDpqaFmG7aN07sS1VlV7IUd2S8oHafA',
'1mErEioMdEynGwxzmMItsA',
'AF1QipPVGMqgKoSQ1-ZTQeaKPkFy2Eno4HiIkUacc2mw',
'QbiSnfO4__Qz66L2mxWPzA',
'AF1QipPAhReORTm9oICvSeam2p--aGkNcEleeA4H3NE1',
'I7JWsLigdVOhYffwZFURTw',
'qXC1-SfnJSygM1g08x2kwQ',
'oPZVNF3kAUfSG8_3Mg2z9A'
];

const fixedMapCenter = { lat: 52.5194748, lng: 13.3842489 };

let panorama: google.maps.StreetViewPanorama;
let map: google.maps.Map;
let currentMarker: google.maps.Marker | null = null;
let markersData: string[] = ['ts_pano_loaded,ts_marker_set,index,lat,lng,distance,areaknowledge'];
let tsPanoLoaded: string;

function initPano(callback) {
  panorama = new google.maps.StreetViewPanorama(
    document.getElementById("map"),
    {
      pano: panoramaIds[currentIndex],
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
  panorama.setPov({
    heading: 30,
    zoom: 0,
    pitch: 0
  });

  tsPanoLoaded = new Date().toISOString();

  panorama.addListener('pano_changed', () => {
    tsPanoLoaded = new Date().toISOString();
    console.log(`Current Panorama ID: ${panorama.getPano()}`);
    console.log(`Timestamp Panorama Loaded: ${tsPanoLoaded}`);
  });

  panorama.addListener('status_changed', () => {
    if (panorama.getStatus() !== 'OK') {
      console.error(`Failed to load panorama ID: ${panoramaIds[currentIndex]}`);
    }
  });

  mapIndex = 0;
  callback();
}


function initMap() {
  const mapType = (userGroup === 'A' && mapIndex % 2 === 0) || (userGroup === 'B' && mapIndex % 2 !== 0) ? standardMapType : hybridMapType;    
  console.log(userGroup, mapIndex ); 
  map = new google.maps.Map(document.getElementById("google-map"), {
    center: mapCenterList[currentIndex],
	restriction: {
		latLngBounds: mapBoundList[currentIndex],
		strictBounds: false,
	},
    zoom: 15,
    disableDefaultUI: true,
    clickableIcons: false,
    mapTypeId: mapType
  });

  map.addListener('click', (event: google.maps.MapMouseEvent) => {
    addMarker(event.latLng);
  });

  map.setOptions({
    gestureHandling: 'greedy',
    zoomControl: true,
  });
  mapIndex++;
}

function addMarker(location: google.maps.LatLng | google.maps.LatLngLiteral) {
  const timestamp = new Date().toISOString();
  const panoIndex = currentIndex + 1;
  const distance = google.maps.geometry.spherical.computeDistanceBetween(
    new google.maps.LatLng(mapCenterList[currentIndex]),
    location
  );
  

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

  const markerData = `${tsPanoLoaded},${timestamp},${panoIndex},${location.lat()},${location.lng()},${distance},`;

  if (currentIndex !== 0) {
    const existingMarkerIndex = markersData.findIndex(data => data.split(",")[2] === panoIndex.toString());

    if (existingMarkerIndex !== -1) {
      markersData[existingMarkerIndex] = markerData;
    } else {
      markersData.push(markerData);
    }
  }
  
}


function changeView() {
  currentIndex = (currentIndex + 1) % panoramaIds.length;
  panorama.setPano(panoramaIds[currentIndex]);
  initMap();
    if (currentIndex == 1) {
	document.getElementById('tutorial')!.style.display = 'none';
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

  exitButton.addEventListener("click", () => {
    modal.style.display = "none";
	yesCheckbox.checked = false;
	noCheckbox.checked = false;
  });
}


function handleCheckboxChange(changedCheckbox: HTMLInputElement, otherCheckbox: HTMLInputElement) {
  if (changedCheckbox.checked) {
    otherCheckbox.checked = false;
  }
  const okButton = document.getElementById("modal-ok-button") as HTMLButtonElement;
  okButton.disabled = !changedCheckbox.checked && !otherCheckbox.checked;
}

function hideModal() {
  const yesCheckbox = document.getElementById("checkbox-yes") as HTMLInputElement;
  const noCheckbox = document.getElementById("checkbox-no") as HTMLInputElement;

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
    document.getElementById("next-button").style.display = "none";
    document.getElementById("submit-button").style.display = "none";
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
	document.getElementById("map-container").style.display = "block";
    showTutorialStep(currentStep);
  };

  document.getElementById('tutorial-next-2')!.onclick = () => {
    currentStep = 2;
	document.getElementById("submit-button").style.display = "block";
    showTutorialStep(currentStep);
  };

  document.getElementById('tutorial-next-3')!.onclick = () => {
    currentStep = 3;
    showTutorialStep(currentStep);
  };

  document.getElementById('tutorial-finish')!.onclick = () => {
    document.getElementById('tutorial')!.style.display = 'none';
  };
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
