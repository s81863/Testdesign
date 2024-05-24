import { saveAs } from 'file-saver';

let currentIndex = 0;
const coordinates = [
  { lat: 54.237717, lng: 9.0863045 },
  { lat: 52.518406, lng: 13.4011736 },
  { lat: 52.5164116, lng: 13.3794872 },
  { lat: 52.5090565, lng: 13.3766477 },
  { lat: 52.5054908, lng: 13.3341694 },
  { lat: 52.5049535, lng: 13.2795553 },
  { lat: 52.5145766, lng: 13.2368277 },
  { lat: 52.544155, lng: 13.3534112 }
];

const fixedMapCenter = { lat: 52.5194748, lng: 13.3842489 };

let panorama: google.maps.StreetViewPanorama;
let map: google.maps.Map;
let currentMarker: google.maps.Marker | null = null;
let markersData: string[] = ['timestamp,index,lat,lng,distance,areaknowledge'];

function initPano() {
  panorama = new google.maps.StreetViewPanorama(
    document.getElementById("map"),
    {
      position: coordinates[currentIndex],
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

  initMap();
}

function initMap() {
  map = new google.maps.Map(document.getElementById("google-map"), {
    center: fixedMapCenter,
    zoom: 12,
    disableDefaultUI: true,
    clickableIcons: false,
	mapTypeId: 'hybrid'
  });

  map.addListener('click', (event: google.maps.MapMouseEvent) => {
    addMarker(event.latLng);
  });

  map.setOptions({
    gestureHandling: 'greedy',
    zoomControl: true,
  });
}

function addMarker(location: google.maps.LatLng | google.maps.LatLngLiteral) {
  const timestamp = new Date().toISOString();
  const panoIndex = currentIndex + 1;
  const distance = google.maps.geometry.spherical.computeDistanceBetween(
    new google.maps.LatLng(coordinates[currentIndex]),
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

  const markerData = `${timestamp},${panoIndex},${location.lat()},${location.lng()},${distance},`;
  markersData.push(markerData);
}

function changeView() {
  currentIndex = (currentIndex + 1) % coordinates.length;
  panorama.setPosition(coordinates[currentIndex]);
  map.setCenter(fixedMapCenter);

  if (currentMarker) {
    currentMarker.setMap(null);
    currentMarker = null;
  }
}

function submitMarker() {
  if (markersData.length > 1) {
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
  document.getElementById("start-message").style.display = "none";
  document.getElementById("map").style.display = "block";
  document.getElementById("map-container").style.display = "block";
  document.getElementById("next-button").style.display = "block";
  document.getElementById("submit-button").style.display = "block";
}

function showModal() {
  const modal = document.getElementById("area-knowledge-modal");
  modal.style.display = "block";
  
  const okButton = document.getElementById("modal-ok-button") as HTMLButtonElement;
  okButton.disabled = true;

  const yesCheckbox = document.getElementById("checkbox-yes") as HTMLInputElement;
  const noCheckbox = document.getElementById("checkbox-no") as HTMLInputElement;

  yesCheckbox.addEventListener("change", () => handleCheckboxChange(yesCheckbox, noCheckbox));
  noCheckbox.addEventListener("change", () => handleCheckboxChange(noCheckbox, yesCheckbox));
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
  
  markersData[markersData.length - 1] += areaKnowledge;

  yesCheckbox.checked = false;
  noCheckbox.checked = false;

  if (currentIndex === coordinates.length - 1) {
    const csvContent = markersData.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'markers_data.csv');

    document.getElementById("finished-message").style.display = "block";
    document.getElementById("map").style.display = "none";
    document.getElementById("map-container").style.display = "none";
    document.getElementById("next-button").style.display = "none";
    document.getElementById("submit-button").style.display = "none";
  } else {
    changeView();
  }
}


declare global {
  interface Window {
    initPano: () => void;
  }
}
window.initPano = initPano;

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
  document.getElementById("start-button").addEventListener("click", startGame);
  document.getElementById("modal-ok-button").addEventListener("click", hideModal);
});

export {};
