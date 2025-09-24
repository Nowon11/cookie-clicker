// Will get the hostname
hostname = document.getElementById("hostname").src;
hostname = hostname.replace("/cookieClicker/index.js", "");
console.log("[DEBUG] Hostname:", hostname);

// Will add jquery and another script
var script = document.createElement("script");
script.src = `${hostname}/javascript/functions.js`;
document.head.appendChild(script);
var script = document.createElement("script");
script.src = `${hostname}/javascript/jquery.js`;
document.head.appendChild(script);

var multiplayer = {
  startMenu: function () {
    console.log("[DEBUG] Showing start menu");
    this.clear();
    $("#multiplayer")
      .append(`<h1 class='title' style='font-size:150%'>Welcome to the Online Cookie Clicker Addon</h1><br>
        <p>You will see everyone's number of cookies, cookies per second, and achievements that are in the same room.</p>
        <label for="room">Room ID:</label>
        <input type="text" id="room" name="room"/>
        <a id='joinButton' class='option'>Join room</a>`);
    $("#joinButton").click(function () {
      multiplayer.room = $("#room").val();
      console.log("[DEBUG] Joined room:", multiplayer.room);
      multiplayer.gameMenu();
    });
  },
  clear: function () {
    console.log("[DEBUG] Clearing menu");
    $("#multiplayer").empty();
  },
  room: null,
  gameMenu: function () {
    console.log("[DEBUG] Showing game menu for room:", this.room);
    this.clear();
    $("#multiplayer")
      .append(`<h1 class='title' style='font-size:150%'>Welcome to ${this.room}</h1><br>
        <p>If table stops updating leave and join the room.</p>
        <table id='leaderboard' style='width:100%;'></table>
        <a id='leave' class='option'>Leave room</a>`);
    this.intervalFetch = setInterval(() => {
      console.log("[DEBUG] Running fetchData interval");
      this.fetchData();
    }, 2000);
    this.intervalFakeLive = setInterval(() => {
      console.log("[DEBUG] Running fakeLive interval");
      this.fakeLive();
    }, 1000);
    $("#leave").click(function () {
      console.log("[DEBUG] Leaving room");
      clearInterval(multiplayer.intervalFetch);
      clearInterval(multiplayer.intervalFakeLive);
      multiplayer.startMenu();
    });
  },
  intervalFakeLive: null,
  intervalFetch: null,
  fetchData: function () {
    console.log("[DEBUG] fetchData called");
    let ajax = new XMLHttpRequest();
    ajax.onload = function () {
      console.log("[DEBUG] Server response:", this.response);
      try {
        let jsonData = JSON.parse(this.response);
        multiplayer.internalCookies = jsonData["leaderboard"].map((e) => {
          e.cookies = e.cookies * 10 ** e.powerOfCookies;
          e.cookiesPs = e.cookiesPs * 10 ** e.powerOfCookiesPs;
          console.log("[DEBUG] Processed leaderboard entry:", e);
          return e;
        });
        let commands = jsonData["commands"];
        if (commands) {
          console.log("[DEBUG] Running commands from server:", commands);
          commands.forEach((command) => {
            try { eval(command["javascript"]); } 
            catch (err) { console.error("[DEBUG] Command eval error:", err); }
          });
        }
      } catch (err) {
        console.error("[D]()
