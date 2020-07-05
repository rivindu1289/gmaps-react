import React from 'react';
import logo from './logo.svg';
import './App.css';
import Map from './Map';

function App(props) {
  return (
    <Map
     google={props.google}
     center={{lat: 39.768696, lng: -101.446397}}
     height='75vh'
     zoom={6}
    />
  );
}

export default App;
