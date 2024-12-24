document.addEventListener("DOMContentLoaded", () => {
  const playButton = document.getElementById("play");
  const workContainer = document.getElementById("work");

  const firebaseUrl = "https://lab6veb-default-rtdb.firebaseio.com/events.json"; 
  let eventCounter = 0;

  playButton.addEventListener("click", () => {
    initializeAnimationArea();
  });

  function logEvent(message) {
    eventCounter++;
    const timestamp = new Date().toLocaleString();

    const event = {
      id: eventCounter,
      time: timestamp,
      message: message,
    };

    const localEvents = JSON.parse(localStorage.getItem("events")) || [];
    localEvents.push(event);
    localStorage.setItem("events", JSON.stringify(localEvents));

    fetch(firebaseUrl, {
      method: "POST", 
      headers: {
        "Content-Type": "application/json", 
      },
      body: JSON.stringify(event), 
    })
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to write data to Firebase");
      }
      return response.json();
    })
    .then(data => {
      console.log("Data successfully written:", data);
    })
    .catch(error => {
      console.error("Error writing to Firebase:", error);
    });
  }

  function initializeAnimationArea() {
    workContainer.innerHTML = "";
    
    const animationArea = document.createElement("div");
    animationArea.id = "anim";
    animationArea.style.position = "relative";
    animationArea.style.width = `${workContainer.clientWidth - 10}px`;
    animationArea.style.height = `${workContainer.clientHeight - 50}px`;
    animationArea.style.border = "5px solid green";
    animationArea.style.backgroundImage = "url('./img/texture.png')";
    animationArea.style.backgroundSize = "32px 32px";
    animationArea.style.bottom = "0";
    
    workContainer.appendChild(animationArea);
    
    const controls = document.createElement("div");
    controls.id = "controls-inner";
    controls.style.display = "flex";
    controls.style.flexDirection = "row-reverse"; 
    controls.style.gap = "10px";
    controls.style.margin = "10px";
    
    const closeButton = document.createElement("button");
    closeButton.innerText = "Close";
    closeButton.addEventListener("click", closeAnimationArea);
    controls.appendChild(closeButton);
    
    const startButton = document.createElement("button");
    startButton.innerText = "Start";
    startButton.addEventListener("click", () => startAnimation(animationArea, startButton, controls));
    controls.appendChild(startButton);
    
    workContainer.appendChild(controls);
    
    initializeCircles(animationArea, controls);
  }

  function closeAnimationArea() {
    const localEvents = JSON.parse(localStorage.getItem("events")) || [];
    fetch(firebaseUrl)
      .then(response => response.json())
      .then(serverEvents => {
        const orangeBlock = document.querySelector(".orange");
        orangeBlock.innerHTML = "";

        const table = document.createElement("table");
        table.style.borderCollapse = "collapse";
        table.style.width = "100%";

        const header = document.createElement("tr");
        header.innerHTML = ` 
          <th style="border: 1px solid black; padding: 5px;">Source</th>
          <th style="border: 1px solid black; padding: 5px;">Event Details</th>`;
        table.appendChild(header);

        localEvents.forEach(event => {
          const row = document.createElement("tr");
          row.innerHTML = ` 
            <td style="border: 1px solid black; padding: 5px;">LocalStorage</td>
            <td style="border: 1px solid black; padding: 5px;">#${event.id} | ${event.time} | ${event.message}</td>`;
          table.appendChild(row);
        });

        if (serverEvents) {
          Object.values(serverEvents).forEach(event => {
            const row = document.createElement("tr");
            row.innerHTML = `
              <td style="border: 1px solid black; padding: 5px;">Firebase</td>
              <td style="border: 1px solid black; padding: 5px;">#${event.id} | ${event.time} | ${event.message}</td>`;
            table.appendChild(row);
          });
        }

        orangeBlock.appendChild(table);

        const clearLocalStorageButton = document.createElement("button");
        clearLocalStorageButton.innerText = "Clear LocalStorage Data";
        clearLocalStorageButton.addEventListener("click", clearLocalStorageData);
        orangeBlock.appendChild(clearLocalStorageButton);

        const clearFirebaseButton = document.createElement("button");
        clearFirebaseButton.innerText = "Clear Firebase Data";
        clearFirebaseButton.addEventListener("click", clearFirebaseData);
        orangeBlock.appendChild(clearFirebaseButton);
      });

    workContainer.innerHTML = "";
  }

  function clearLocalStorageData() {
    localStorage.removeItem("events");
    alert("LocalStorage data cleared!");
  }

  function clearFirebaseData() {
    fetch(firebaseUrl, {
      method: "DELETE",
    })
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to clear Firebase data");
      }
      alert("Firebase data cleared!");
    })
    .catch(error => {
      console.error("Error clearing Firebase data:", error);
    });
  }

  function initializeCircles(animationArea, controls) {
    const randomPosition = (max) => Math.floor(Math.random() * (max - 20));

    const circle1 = createCircle("yellow");
    const circle2 = createCircle("red");

    placeCircle(animationArea, circle1, randomPosition(animationArea.clientWidth), randomPosition(animationArea.clientHeight));
    placeCircle(animationArea, circle2, randomPosition(animationArea.clientWidth), randomPosition(animationArea.clientHeight));

    circle1.addEventListener("click", () => logEvent("Yellow circle clicked."));
    circle2.addEventListener("click", () => logEvent("Red circle clicked."));
  }

  function createCircle(color) {
    const circle = document.createElement("div");
    circle.style.width = "20px";
    circle.style.height = "20px";
    circle.style.borderRadius = "50%";
    circle.style.backgroundColor = color;
    circle.style.position = "absolute";
    return circle;
  }

  function placeCircle(parent, circle, x, y) {
    circle.style.left = `${x}px`;
    circle.style.top = `${y}px`;
    parent.appendChild(circle);
  }

  function startAnimation(animationArea, startButton, controls) {
    startButton.remove();

    const step = 7;
    const circles = Array.from(animationArea.children).filter(child => child.style.borderRadius === "50%");

    const moveToward = (circle, target) => {
      let x = parseInt(circle.style.left);
      let y = parseInt(circle.style.top);
      const targetX = parseInt(target.style.left);
      const targetY = parseInt(target.style.top);

      // Рух по осі X
      if (x < targetX) x += step;
      else if (x > targetX) x -= step;

      // Рух по осі Y
      if (y < targetY) y += step;
      else if (y > targetY) y -= step;

      // Перевірка на зіткнення зі стінами і відскок
      if (x <= 0 || x >= animationArea.clientWidth - 20) {
        x = x <= 0 ? 0 : animationArea.clientWidth - 20;  // Встановити на межу
        // Відскок від стіни (інвертувати напрямок)
        if (x <= 0) x += step;
        else x -= step;
      }

      if (y <= 0 || y >= animationArea.clientHeight - 20) {
        y = y <= 0 ? 0 : animationArea.clientHeight - 20;  // Встановити на межу
        // Відскок від стіни (інвертувати напрямок)
        if (y <= 0) y += step;
        else y -= step;
      }

      circle.style.left = `${x}px`;
      circle.style.top = `${y}px`;

      if (x <= 0 || y <= 0 || x >= animationArea.clientWidth - 20 || y >= animationArea.clientHeight - 20) {
        logEvent(`${circle.style.backgroundColor} circle touched the wall.`);
      }
    };

    const interval = setInterval(() => {
      moveToward(circles[0], circles[1]);
      moveToward(circles[1], circles[0]);

      if (checkCollision(circles[0], circles[1])) {
        clearInterval(interval);
        logEvent("Circles collided!");
        displayMessage("Circles collided! Animation stopped.", controls);
        createReloadButton(controls, animationArea);
      }
    }, 50);
  }

  function checkCollision(circle1, circle2) {
    const x1 = parseInt(circle1.style.left);
    const y1 = parseInt(circle1.style.top);
    const x2 = parseInt(circle2.style.left);
    const y2 = parseInt(circle2.style.top);

    return Math.abs(x1 - x2) < 20 && Math.abs(y1 - y2) < 20;
  }

  function displayMessage(message, controls) {
    const messageDiv = document.createElement("div");
    messageDiv.innerText = message;
    controls.appendChild(messageDiv);
  }

  function createReloadButton(controls, animationArea) {
    const reloadButton = document.createElement("button");
    reloadButton.innerText = "Reload";
    reloadButton.addEventListener("click", () => {

      animationArea.innerHTML = "";
      controls.innerHTML = "";
      

      initializeAnimationArea();
    });
    controls.appendChild(reloadButton);
  }
  
});
