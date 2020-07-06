import React from 'react'
import { withGoogleMap, GoogleMap, withScriptjs, InfoWindow, Marker } from "react-google-maps";
import Autocomplete from 'react-google-autocomplete';
import Geocode from "react-geocode";
import stData from './states.json';

const apiKey = "AIzaSyC-pWnGfAfu6iNwSC6wkhgCLmpt7Wwx1ug"; // PUT YOUR API KEY HERE

Geocode.setApiKey(apiKey);
Geocode.enableDebug();

class Map extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            address: '',
            city: '',
            state: '',
            mapPosition: {
                lat: this.props.center.lat,
                lng: this.props.center.lng
            },
            markers: [],
            stObj: JSON.parse(JSON.stringify(stData)),
            ml: 0
        };
    }

    /**
    * Get the current address from the default map position and set those values in the state
    */
    componentDidMount() {
        Geocode.fromLatLng(this.state.mapPosition.lat, this.state.mapPosition.lng).then(
            response => {
                const address = response.results[0].formatted_address,
                    addressArray = response.results[0].address_components,
                    city = this.getCity(addressArray),
                    state = this.getState(addressArray);

                console.log('city', city, state);

                this.setState({
                    address: (address) ? address : '',
                    city: (city) ? city : '',
                    state: (state) ? state : '',
                })
            },
            error => {
                console.error(error);
            }
        );
    }

    /**
    * Component should only update ( meaning re-render ), when the user selects the address, or drags the pin
    *
    * @param nextProps
    * @param nextState
    * @return {boolean}
    */
    shouldComponentUpdate(nextProps, nextState) {
        if (
            (nextState.markers.length === nextState.ml)
        ) {
            return true
        } else if (this.props.center.lat === nextProps.center.lat) {
            return false
        }
    }

    /**
    * Get the city and set the city input value to the one selected
    *
    * @param addressArray
    * @return {string}
    */
    getCity = (addressArray) => {
        let city = '';
        for (let i = 0; i < addressArray.length; i++) {
            if (addressArray[i].types[0] && 'locality' === addressArray[i].types[0]) {
                city = addressArray[i].long_name;
                return city;
            }
        }
    };

    /**
    * Get the address and set the address input value to the one selected
    *
    * @param addressArray
    * @return {string}
    */
    getState = (addressArray) => {
        let state = '';
        for (let i = 0; i < addressArray.length; i++) {
            for (let i = 0; i < addressArray.length; i++) {
                if (addressArray[i].types[0] && 'administrative_area_level_1' === addressArray[i].types[0]) {
                    state = addressArray[i].long_name;
                    return state;
                }
            }
        }
    };

    /**
    * And function for city,state and address input
    * @param event
    */
    onChange = (event) => {
        this.setState({ [event.target.name]: event.target.value });
    };

    /**
    * This Event triggers when the marker window is closed
    *
    * @param event
    */
    onInfoWindowClose = (event) => { };
    
    /**
    * When the user types an address in the search box
    * @param place
    */
    onPlaceSelected = (place) => {
        const address = place.formatted_address,
            addressArray = place.address_components,
            city = this.getCity(addressArray),
            state = this.getState(addressArray),
            latValue = place.geometry.location.lat(),
            lngValue = place.geometry.location.lng();// Set these values in the state.

        let m = [];
        let st = this.state.stObj[state];
        fetch("https://covid-19-testing.github.io/locations/"+String(st)+"/complete.json")
            .then(response => response.json())
            .then(jsonData => {
                this.setState({
                    markers:[],
                    ml: jsonData.length
                });
                for (var i = 0; i < jsonData.length; i++){
                    let obj = jsonData[i];
                    let addData = obj.physical_address[0];
                    let add = addData.address_1 + " " + addData.city + " " + addData.state_province + " " + addData.postal_code;

                    Geocode.fromAddress(add)
                        .then(response => {
                            let lat1 = response.results[0].geometry.location.lat,
                                lng1 = response.results[0].geometry.location.lng;
                                
                            m[m.length] = {lat:lat1, lng:lng1, address:add, name:obj.name};
                            this.setState({
                                markers:m,
                            });
                        },
                        error => {
                            console.error(error);
                        });
                }
            });
        this.setState({
            address: (address) ? address : '',
            city: (city) ? city : '',
            state: (state) ? state : '',
            mapPosition: {
                lat: latValue,
                lng: lngValue
            },
        });
    };

    render() {
        let mk = [];
        for (var loc of this.state.markers){
            mk[mk.length] = <Marker google={this.props.google}
                                        name={loc.name}
                                        draggable={false}
                                        position={{ lat: Number(loc.lat), lng: Number(loc.lng) }}
                                    />;
        }
        const AsyncMap = withScriptjs(
            withGoogleMap(
                props => (
                    <GoogleMap google={this.props.google}
                        defaultZoom={this.props.zoom}
                        defaultCenter={{ lat: this.state.mapPosition.lat, lng: this.state.mapPosition.lng }}
                    >
                        {/* For Auto complete Search Box */}
                        <Autocomplete
                            style={{
                                width: '100%',
                                height: '40px',
                                paddingLeft: '16px',
                                marginTop: '2px',
                                marginBottom: '100px'
                            }}
                            onPlaceSelected={this.onPlaceSelected}
                            types={['address']}
                            key = {apiKey}  
                        />
                        {/*Marker*/}
                        {mk}
                        </GoogleMap>)
            )
        );
        let map;
        if (this.props.center.lat !== undefined) {
            map = <div>
                <div>
                    <div className="form-group">
                    <label htmlFor="">City</label>
                        <input type="text" name="city" className="form-control" onChange={this.onChange} readOnly="readOnly" value={this.state.city} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="">State</label>
                        <input type="text" name="state" className="form-control" onChange={this.onChange} readOnly="readOnly" value={this.state.state} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="">Address</label>
                        <input type="text" name="address" className="form-control" onChange={this.onChange} readOnly="readOnly" value={this.state.address} />
                    </div>
                </div>
                <AsyncMap
                    googleMapURL={"https://maps.googleapis.com/maps/api/js?key=" + apiKey + "&libraries=places"}
                    loadingElement={
                        <div style={{ height: `100%` }} />
                    }
                    containerElement={
                        <div style={{ height: this.props.height }} />
                    }
                    mapElement={
                        <div style={{ height: `100%` }} />
                    }
                />
            </div>
        } else {
            map = <div style={{ height: this.props.height }} />
        }
        return (map)
    }
}

export default Map