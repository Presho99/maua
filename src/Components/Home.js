import React from "react";
import Login from "./Login";
import "./Home.css";
import background from "../assets/background.jpeg";
import dahlia from "../assets/dahlia.jpeg";
import gerbera from "../assets/gerbera.jpeg";
import rose from "../assets/rose.jpeg";
import {
  CarouselProvider,
  Slider,
  Slide,
  ButtonBack,
  ButtonNext,
} from "pure-react-carousel";
import "pure-react-carousel/dist/react-carousel.es.css";
import FlowerItem from "./FlowerItem";

const flowers = [
  {
    id: "m1",
    name: "Dahlia",
    description: "Finest fish and veggies",
    price: "22.99",
    family: "Asteraceae",
    origin: "Mexico",
    symbols: "Devotion, love, beauty, dignity",
    image: { rose },
  },
  {
    id: "m2",
    name: "Gerbera",
    description: "A German specialty",
    price: "16.5",
    family: "Asteraceae",
    origin: "Mexico",
    symbols: "Innocence, loyal love, purity, cheerfulness",
    image: { rose },
  },
  {
    id: "m3",
    name: "Hydrangea",
    description: "American, raw, meaty",
    price: "12.99",
    family: "Asteraceae",
    origin: "Mexico",
    symbols: "Gratitude, beauty, grace",
    image: { rose },
  },
  {
    id: "m4",
    name: "Peonies",
    description: "Healthy...and green...",
    price: "18.99",
    family: "Asteraceae",
    origin: "Mexico",
    symbols: "Devotion, love, beauty, dignity",
    image: { rose },
  },
  {
    id: "m5",
    name: "Rose",
    description: "Healthy...and green...",
    price: "18.99",
    family: "Asteraceae",
    origin: "Mexico",
    symbols: "Devotion, love, beauty, dignity",
    image: { rose },
  },
  {
    id: "m6",
    name: "Sunflower",
    description: "Healthy...and green...",
    price: "18.99",
    family: "Asteraceae",
    origin: "Mexico",
    symbols: "Devotion, love, beauty, dignity",
    image: { rose },
  },
  {
    id: "m7",
    name: "Carnation",
    description: "Healthy...and green...",
    price: "18.99",
    family: "Asteraceae",
    origin: "Mexico",
    image: { rose },
    symbols: "Devotion, love, beauty, dignity",
  },
  {
    id: "m8",
    name: "Tulips",
    description: "Healthy...and green...",
    price: "18.99",
    family: "Asteraceae",
    origin: "Mexico",
    symbols: "Devotion, love, beauty, dignity",
    image: { rose },
  },
  {
    id: "m9",
    name: "Orchids",
    description: "Finest fish and veggies",
    price: "22.99",
    family: "Asteraceae",
    origin: "Mexico",
    symbols: "Devotion, love, beauty, dignity",
    image: { rose },
  },
  {
    id: "m10",
    name: "Lily",
    description: "Finest fish and veggies",
    price: "22.99",
    family: "Asteraceae",
    origin: "Mexico",
    symbols: "Devotion, love, beauty, dignity",
    image: { rose },
  },
];

function Home() {
  
    return (
      <div className="home">
        <div className="item item1">
          <div className="one-name">
            <h1>{flowers[0].name}</h1>
          </div>
          <div className="one-desc">
            <p>
              Dahlia is a genus of bushy, tuberous, herbaceous perennial plants
              native to Mexico and Central America. A member of the Asteraceae
              family of dicotyledonous plants, its relatives thus include the
              sunflower, daisy, chrysanthemum, and zinnia.
            </p>
          </div>
          <div className="one-family">
            <div>
              <h3>Origin</h3>
              <p>Mexico</p>
            </div>
            <div>
              <h3>Family</h3>
              <p>Asteraceae</p>
            </div>
          </div>
        </div>
        <div className="item item2">
          <div className="carousel">
            
          </div>
        </div>
        <div className="item item3">
          <div className="magnified-image">

          </div>
        </div>
      </div>
    );
    // <FlowerItem
    //   key={flower.id}
    //   id={flower.id}
    //   name={flower.name}
    //   description={flower.description}
    //   price={flower.price}
    //   family={flower.family}
    //   origin={flower.origin}
    //   image={flower.image}
    //   symbol={flower.symbols}
    // />
 
 
}

export default Home;
