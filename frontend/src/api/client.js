import axios from "axios";

// https://rmovie.onrender.com/api

// const baseurl = "https://rmovie.onrender.com/api"

const client = axios.create({ baseURL: "https://rmovie.onrender.com/api"});

// const client = axios.create({ baseURL: "http://localhost:8000/api"});

export default client;
