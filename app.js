const express = require("express");
const app = express();
const engine = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const passport = require("passport");
const favicon = require("serve-favicon");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const MongoDBStore = require("connect-mongo")(session);
const game = require("./server-game");

const uri = "mongodb+srv://dbUser:5J2wYCCyTe5nhvSu@cluster.uuemj.mongodb.net/games?retryWrites=true&w=majority";

mongoose.connect(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useCreateIndex: true,
	useFindAndModify: false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
	console.log("Database connected");
});

const secret = process.env.SECRET || "12jk32hk?kshd&k$k%23h43kjfhsxhoia!";

const store = new MongoDBStore({
	url: uri,
	secret,
	touchAfter: 24 * 60 * 60
});

store.on("error", function(e) {
	console.log("SESSION STORE ERROR", e);
});

const sessionConfig = {
	store,
	name: "session",
	secret,
	resave: false,
	saveUninitialized: true,
	cookie: {
		httpOnly: true,
		// secure: true,
		expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
		maxAge: 1000 * 60 * 60 * 24 * 7
	}
};
app.use(session(sessionConfig));

// Host and port
const hostname = "127.0.0.1";
const port = 3000;

app.engine("ejs", engine);
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(favicon(path.join(__dirname, "public", "img", "favicon.ico")));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
	res.locals.currentUser = req.user;
	res.locals.success = req.flash("success");
	res.locals.error = req.flash("error");
	next();
});

// Static node module files
app.use("/modules/fontawesome", express.static(__dirname + "/node_modules/@fortawesome/fontawesome-free/"));
app.use("/modules/alpinejs", express.static(__dirname + "/node_modules/alpinejs/dist/"));
app.use("/modules/jquery", express.static(__dirname + "/node_modules/jquery/dist/"));
app.use("/modules/animatecss", express.static(__dirname + "/node_modules/animate.css/"));
app.use("/modules/animejs", express.static(__dirname + "/node_modules/animejs/lib"));

const userRoutes = require("./routes/userRoutes");
const hostRoutes = require("./routes/hostRoutes");
const playRoutes = require("./routes/playRoutes");

const middleware = require("./middleware");
const { isLoggedIn, isTeacher, isStudent } = middleware;

app.use("/", userRoutes);
app.use("/dashboard", isLoggedIn, isTeacher, hostRoutes);
app.use("/play", isLoggedIn, isStudent, playRoutes);

app.get("/", function(req, res) {
	res.render("home", { user: req.user });
});

io.on("connection", (socket) => {
	game.initGame(io, socket);
});

http.listen(port, hostname, function() {
	console.log(`Server running at http://${hostname}:${port}/`);
});
