import React, { useEffect, useState } from "react";
import "./Home.css";

import FlowerItem from "./FlowerItem";
import { useSprings, animated } from "@react-spring/web";

const flowers = [
  {
    id: "m1",
    name: "Dahlia",
    description: "Finest fish and veggies",
    price: "22.99",
    family: "Asteraceae",
    origin: "Mexico",
    symbols: "Devotion, love, beauty, dignity",
    image: "/assets/dahliabouquet.jpeg",
  },
  {
    id: "m2",
    name: "Gerbera",
    description: "A German specialty",
    price: "16.5",
    family: "Asteraceae",
    origin: "Mexico",
    symbols: "Innocence, loyal love, purity, cheerfulness",
    image: "/assets/gerberabouquet.jpeg",
  },
  {
    id: "m3",
    name: "Hydrangea",
    description: "American, raw, meaty",
    price: "12.99",
    family: "Asteraceae",
    origin: "Mexico",
    symbols: "Gratitude, beauty, grace",
    image: "/assets/hydrangea.jpeg",
  },
  {
    id: "m4",
    name: "Peonies",
    description: "Healthy...and green...",
    price: "18.99",
    family: "Asteraceae",
    origin: "Mexico",
    symbols: "Devotion, love, beauty, dignity",
    image: "/assets/peonies.jpeg",
  },
  {
    id: "m5",
    name: "Rose",
    description: "Healthy...and green...",
    price: "18.99",
    family: "Asteraceae",
    origin: "Mexico",
    symbols: "Devotion, love, beauty, dignity",
    image: "/assets/rose.jpeg",
  },
  {
    id: "m6",
    name: "Sunflower",
    description: "Healthy...and green...",
    price: "18.99",
    family: "Asteraceae",
    origin: "Mexico",
    symbols: "Devotion, love, beauty, dignity",
    image: "/assets/Sunflower.jpeg",
  },
  {
    id: "m7",
    name: "Carnation",
    description: "Healthy...and green...",
    price: "18.99",
    family: "Asteraceae",
    origin: "Mexico",
    image: "/assets/carnation.jpeg",
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
    image: "/assets/Tulipas.jpeg",
  },
  {
    id: "m9",
    name: "Orchids",
    description: "Finest fish and veggies",
    price: "22.99",
    family: "Asteraceae",
    origin: "Mexico",
    symbols: "Devotion, love, beauty, dignity",
    image: "/assets/orchids.jpeg",
  },
  {
    id: "m10",
    name: "Lily",
    description: "Finest fish and veggies",
    price: "22.99",
    family: "Asteraceae",
    origin: "Mexico",
    symbols: "Devotion, love, beauty, dignity",
    image: "/assets/lilybouquet.jpeg",
  },
];

function Home() {
  // For the carousel and animations
  const [active, setActive] = useState(0);
  const [springs, springsAPI] = useSprings(
    10,
    (i) => ({
      from: {
        opacity: active === i ? 1 : 0,
        color: active === i ? "#ED5079" : "pink",
        width: active === i ? 200 : 0,
        width2: active === i ? 90 : 0,
      },
      reset: true,
    }),
    [active]
  );

  useEffect(() => {
    springsAPI.stop();
    springsAPI.start((i) => {
      if (i === active) {
        return {
          delay: 5000,
          color: "pink",
          opacity: 0,
          config: {
            duration: 600,
          },
        };
      } else if (i % 10 === (active + 1) % 10) {
        return {
          delay: 5200,
          color: "#ed5709",
          opacity: 1,
          config: {
            duration: 400,
          },
          onRest: () => {
            setActive((a) => (a + 1) % 10);
          },
        };
      } else {
        return {
          opacity: 0,
          color: "pink",
          config: {
            duration: 0,
          },
        };
      }
    });
  }, [springsAPI, active]);
  // For the cart
  const [cartIsShown, setCartIsShown] = useState(false);

  const showCartHandler = () => {
    setCartIsShown(true)
  }

  const hideCartHandler = () => {
    setCartIsShown(false)
  }

  // For the counter
  const [count, setCount] = useState(1);
  const increment = () => {
    setCount((prevCount) => prevCount + 1);
  };

  const decrement = () => {
    if (count > 1) {
      setCount((prevCount) => prevCount - 1);
    }
  };

  return (
    <div className="home">
      <div className="controls">
        {springs.map(({ opacity, color }, i) => {
          return (
            <animated.div onClick={() => setActive(i)}>
              <animated.div
                className="circle"
                style={{ background: color }}
              ></animated.div>
            </animated.div>
          );
        })}
      </div>
      {springs.map(({ opacity }, i) => {
        return (
          <animated.div style={{ opacity }} className="content">
            <div className="item item1">
              <div className="one-name">
                <h1>{flowers[i].name}</h1>
              </div>
              <div className="one-desc">
                <p>{flowers[i].description}</p>
              </div>
              <div className="one-family">
                <div>
                  <h3>Origin</h3>
                  <p>{flowers[i].origin}</p>
                </div>
                <div>
                  <h3>Family</h3>
                  <p>{flowers[i].family}</p>
                </div>
              </div>
            </div>
            <div className="item item2">
              <div className="carousel">
                <animated.div className="flowers-div">
                  <img src={flowers[i].image} />
                </animated.div>
              </div>
            </div>

            {/* Add to Cart Div */}
            <div className="item item3">
              <div className="flower-deets">
                <div className="mini-carousel-container">
                  {springs.map(({ width, width2 }, i) => {
                    return (
                      <animated.div
                        className="mini-carousel"
                        style={{
                          opacity: i === active ? 1 : 0,
                        }}
                      >
                        <animated.div
                          className="mini-main"
                          style={{
                            backgroundImage: `url(${flowers[i].image})`,
                            // width: width.to(w => (`${w}px`)),
                            marginRight: "10px",

                            width: "200px",
                          }}
                        ></animated.div>
                        <animated.div
                          className="mini-main"
                          style={{
                            backgroundImage: `url(${
                              flowers[(i + 1) % 10].image
                            })`,
                            // width: width2.to(w => (`${w}px`)),
                            width: "90px",
                            right: 0,
                          }}
                        ></animated.div>
                      </animated.div>
                    );
                  })}
                </div>

                <div className="quote">
                  <p>Symbols: {flowers[i].symbols}</p>
                </div>
                <div className="price">
                  <div className="number">
                    <h3>${flowers[i].price * count}</h3>
                  </div>
                  <div className="price-form">
                    <button onClick={decrement}>-</button>
                    <p>{count}</p>
                    <button onClick={increment}>+</button>
                  </div>
                </div>
              </div>
              <button className="item3-button">Add to Cart</button>
            </div>
          </animated.div>
        );
      })}
    </div>
  );
}

export default Home;
