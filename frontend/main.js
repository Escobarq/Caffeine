document.addEventListener("DOMContentLoaded", () => {
  const decreaseBtn = document.getElementById("decrease");
  const increaseBtn = document.getElementById("increase");
  const countEl = document.getElementById("count");

  const STORAGE_KEY = "frontend.counter.value";

  let value = Number.parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);

  const render = () => {
    countEl.textContent = String(value);
    // animación breve
    countEl.classList.add("count-bump");
    setTimeout(() => countEl.classList.remove("count-bump"), 140);
    localStorage.setItem(STORAGE_KEY, String(value));
  };

  decreaseBtn.addEventListener("click", () => {
    value -= 1;
    render();
  });

  increaseBtn.addEventListener("click", () => {
    value += 1;
    render();
  });

  render();
});
