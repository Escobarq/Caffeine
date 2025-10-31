// Simple counter example
let count = 0;

document.getElementById("increase").addEventListener("click", () => {
  count++;
  updateCount();
});

document.getElementById("decrease").addEventListener("click", () => {
  count--;
  updateCount();
});

function updateCount() {
  document.getElementById("count").textContent = count;
  document.getElementById("count").style.transform = "scale(1.1)";
  setTimeout(() => {
    document.getElementById("count").style.transform = "scale(1)";
  }, 100);
}

// Log when app loads
console.log("Caffeine App loaded!");
console.log("Edit me in frontend/main.js");
