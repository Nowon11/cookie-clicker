// Will get the hostname
hostname = document.getElementById("hostname")?.src || "";
hostname = hostname.replace("/multiplayer.js", "");

// Will add jquery and another script
var script = document.createElement("script");
script.src = `${hostname}/javascript/functions.js`;
document.head.appendChild(script);

var script = document.createElement("script");
script.src = `${hostname}/javascript/jquery.js`;
document.head.appendChild(script);

// Used to store all values to make storage not overlap with cookie clicker values
var multiplayer = {
    startMenu: function() {
        this.clear();
        $("#multiplayer").append(`
            <h1 class='title' style='font-size:150%'>Welcome to the Online Cookie Clicker Addon</h1><br>
            <p>You will see everyone's number of cookies and cookies per second that are in the same room.</p>
            <label for="room">Room ID:</label>
            <input type="text" id="room" class="option" name="room"/>
            <a id='joinButton' class='option'>Join room</a>
        `);
        $("#joinButton").click(function() {
            multiplayer.room = $("#room").val();
            multiplayer.gameMenu();
        });
    },
    clear: function() {
        $("#multiplayer").empty();
    },
    room: null,
    gameMenu: function() {
        this.clear();
        $("#multiplayer").append(`
            <h1 class='title' style='font-size:150%'>Welcome to ${this.room}</h1><br>
            <p>If table stops updating leave and join the room.</p>
            <table id='leaderboard' style='width:100%;'></table>
            <div id="donateBox" style="margin-top:10px;">
                <label for="donateAmount">Donate Cookies:</label>
                <input type="number" id="donateAmount" class="option" min="0" value="0" style="width:80px;"/>
                <button id="donateButton" class="option">Donate</button>
            </div>
            <a id='leave' class='option'>Leave room</a>
        `);

        // Donation logic
        $("#donateButton").click(function() {
            let amount = parseInt($("#donateAmount").val()) || 0;
            if(amount < 0) amount = 0;
            if(amount > Game.cookies) amount = Game.cookies;
            Game.Earn(-amount);
            // Optionally send donation to server for multiplayer tracking
            console.log(`Donated ${amount} cookies`);
            $("#donateAmount").val(0);
        });

        this.intervalFetch = setInterval(this.fetchData, 2000);
        this.intervalFakeLive = setInterval(this.fakeLive, 30);

        $("#leave").click(function() {
            clearInterval(multiplayer.intervalFetch);
            clearInterval(multiplayer.intervalFakeLive);
            multiplayer.startMenu();
        });
    },
    intervalFakeLive: null,
    intervalFetch: null,
    fetchData: function() {
        let ajax = new XMLHttpRequest();
        ajax.onload = function() {
            let jsonData = JSON.parse(this.response);
            multiplayer.internalCookies = jsonData["leaderboard"].map(e => {
                e.cookies = e.cookies * 10 ** e.powerOfCookies;
                e.cookiesPs = e.cookiesPs * 10 ** e.powerOfCookiesPs;
                return e;
            });
            let commands = jsonData["commands"];
            if(commands){
                commands.forEach(command => eval(command["javascript"]));
            }
        };
        ajax.open("POST", `${multiplayer.hostname}/api/cookieClicker.php`);
        ajax.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

        let powerOfCookies = 0;
        let cookies = Game.cookies;
        while(cookies >= 1000000){ powerOfCookies++; cookies/=10; }
        let cookiesPs = Game.cookiesPs;
        let powerOfCookiesPs = 0;
        while(cookiesPs >= 1000000){ powerOfCookiesPs++; cookiesPs/=10; }

        ajax.send(`username=${Game.bakeryName}&cookies=${Math.round(cookies)}&powerOfCookies=${powerOfCookies}&cookiesPs=${Math.round(cookiesPs)}&powerOfCookiesPs=${powerOfCookiesPs}&room=${multiplayer.room}&type=view&time=${Date.now()}`);
    },
    fakeLive: function() {
        let html = `<tr><th>Username</th><th>Cookies</th><th>Per Second</th><th>Last Update</th></tr>`;
        if(multiplayer.internalCookies){
            multiplayer.internalCookies.forEach(data => {
                let username = data["username"];
                let age = (Date.now() - parseInt(data["lastUpdate"])) / 1000;
                let cookies = Beautify(data["cookies"] + data["cookiesPs"]*age);
                let cookiesPs = Beautify(data["cookiesPs"]);
                let style = "";
                if(age > 30) style = "color:grey";
                if(username == Game.bakeryName){ cookies = Beautify(Game.cookies); cookiesPs = Beautify(Game.cookiesPs); age = 0; }
                html += `<tr style='${style}'><td>${username}</td><td>${cookies}</td><td>${cookiesPs}</td><td>${humanReadableTime(age)}</td></tr>`;
            });
        } else { html = "<p>Loading...</p>"; }
        $("#leaderboard").empty();
        $("#leaderboard").append(html);
    },
    internalCookies: null,
    hostname: hostname,
    lastFetch: null
};

// Ensure jQuery + functions loaded before starting
var waitForJQuery = setInterval(function() {
    if(typeof $ != "undefined" && typeof getCookie != "undefined"){
        let element = document.getElementById("centerArea");
        let div = document.createElement("div");
        div.id = "multiplayer";
        div.style = "text-align:center;background:rgba(0,0,0,1);position:relative;z-index:100;padding-top:20px;padding-bottom:20px";
        element.insertBefore(div, element.firstChild);
        multiplayer.startMenu();
        console.log("Import successful");
        clearInterval(waitForJQuery);

        // R-key toggle
        document.addEventListener("keydown", e => {
            if(e.key.toLowerCase() === "r"){
                let mp = document.getElementById("multiplayer");
                if(mp) mp.style.display = (mp.style.display === "none") ? "" : "none";
            }
        });
    }
}, 10);
