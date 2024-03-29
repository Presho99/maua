import React, { useEffect, useContext, useState, Fragment, useRef } from "react";
import "./Home.css";
import Cart from "./Cart";
import Input from "./Input";
import CartContext from "../store/cart-context";

import FlowerItem from "./FlowerItem";
import { useSprings, animated } from "@react-spring/web";
import { useCartContext } from "../App";

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

function Home(props) {

  const {setItems, items} = useCartContext()

  const [count, setCount] = useState(1);
  const [amountIsValid, setAmountIsValid] = useState(true)
   // For the cart
   const [cartIsShown, setCartIsShown] = useState(false);
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
  }, [springsAPI, active, count]);

  // To track product change and reset to 1 
  useEffect(() => {
    setCount(1)
  }, [active])
 

  // For the counter
  
  const increment = () => {
    setCount((prevCount) => prevCount + 1);
  };

  const decrement = () => {
    if (count > 1) {
      setCount((prevCount) => prevCount - 1);
    }
  };
  // For adding item to cart
  const addToCartHandler = (amount) => {
   
  }

  // For the 'add to cart button'
  const addToCartButtonHandler = () => {
    const existing = items.find(item => item.flower.name === flowers[active].name)
    if (existing){
      const inexistent = items.filter(item => item.flower.name !== existing.flower.name)
      existing.quantity += count
      setItems([...inexistent, existing])
    } else {
setItems(() => [...items, {flower: flowers[active], quantity: count}])
    }
    setCount(1)
  }
  

  // For the form
  

 

  


  return (
    <Fragment>
      {props.cartIsShown && <Cart hideCartHandler={props.hideCartHandler} />}
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
                      <h3>${(flowers[i].price * count).toFixed(2)}</h3>
                    </div>
                    <form className="price-form" onSubmit={(e)=> e.preventDefault() }>
                      <button onClick={decrement}>-</button>
                      <div className="input-form" >
                       <input type="number"  value={count} onChange={(e)=> setCount(+e.target.value)}/>
                      </div>
                      <button onClick={increment}>+</button>
                    </form>
                  </div>
                </div>
                <button className="item3-button" onClick={addToCartButtonHandler}>Add to Cart</button>
                {!amountIsValid && <p>Please select a flower</p>}
              </div>
            </animated.div>
          );
        })}
      </div>
    </Fragment>
  );
}

export default Home;
