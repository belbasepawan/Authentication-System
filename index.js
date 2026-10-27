import express from "express";
import session from "express-session";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.static("public"));


app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(session({
    name: "app_session",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 1000 * 60 * 30
    }
}));


const USER = {
    username: "pawan",
    password: "1234"
};


function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    next();
}


app.get("/", (req, res) => {
    res.redirect(req.session.user ? "/dashboard" : "/login");
});


app.get("/login", (req, res) => {
    if (req.session.user) {
        return res.redirect("/dashboard");
    }

    res.render("login", { error: null });
});

app.post("/login", (req, res, next) => {
    const { username, password } = req.body;

    if (
        username !== USER.username ||
        password !== USER.password
    ) {
        return res.status(401).render("login", {
            error: "Invalid username or password"
        });
    }

    req.session.regenerate((err) => {
        if (err) return next(err);

        req.session.user = { username };

        req.session.save((err) => {
            if (err) return next(err);
            res.redirect("/dashboard");
        });
    });
});


app.get("/dashboard", requireAuth, (req, res) => {
    res.render("dashboard", {
        username: req.session.user.username
    });
});


app.post("/logout", requireAuth, (req, res, next) => {
    req.session.destroy((err) => {
        if (err) return next(err);

        res.clearCookie("app_session");
        res.redirect("/login");
    });
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server running at http://localhost:3000");
});
