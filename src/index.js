// import React from 'react';
// import ReactDOM from 'react-dom';
// import './index.css';
// import App from './App';
// import * as serviceWorker from './serviceWorker';

// ReactDOM.render(<App />, document.getElementById('root'));

// // If you want your app to work offline and load faster, you can change
// // unregister() to register() below. Note this comes with some pitfalls.
// // Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();

import React from "react";
import ReactDOM from "react-dom";

import Spotify from "spotify-web-api-js";

import "./styles.css";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.display_name = '';
    this.state = {
      authenticated: false,
      category: 0,
      songs: [],
      isPlaying: false,
      search: "",
      currentDevice: ""
    };
    this.onSubmit = this.onSubmit.bind(this);
  }

  async componentDidMount() {
    if (window.location.hash) {
      // Remove the "#"
      const queryString = window.location.hash.substring(1);
      // Parse the access_token out
      const accessToken = new URLSearchParams(queryString).get("access_token");
      this.spotifyClient = new Spotify();
      this.spotifyClient.setAccessToken(accessToken);

      const { devices } = await this.spotifyClient.getMyDevices();
      // const devices = Object.keys(devicesResp).map(key => devicesResp[key]);
      this.setState({
        authenticated: true,
        devices,
        currentDevice: devices[0].id
      });

      await this.spotifyClient.getMe(null, (err, val) => {
        if (!err) {
            console.log(val.display_name);
            this.display_name = val.display_name;
        } else {
            console.log(err);
        }
    })

    }
  }

  async startPlayback(songId) {
    await this.spotifyClient.play({
      device_id: this.state.currentDevice,
      uris: [`spotify:track:${songId}`]
    });
  }

  async onSubmit(ev) {
    ev.preventDefault();
    const {
      tracks: { items: songs }
    } = await this.spotifyClient.searchTracks(this.state.search, {
      market: "us"
    });
    this.setState({ songs });
  }


  async getArtists() {
    console.log("getArtists");
    await this.spotifyClient.getMyTopArtists(null, (err, val) => {
        if (!err) {
            console.log(val);
        } else {
            console.log(err);
        }
    });
  }

  async searchArtists() {
    console.log("search");
    const letter = this.display_name.substring(0, 1);
    console.log(letter)
    await this.spotifyClient.searchArtists(letter, null, (err, val) => {
        if (!err) {
            const artistsArr = [];
            var i;
            for (i = 0; i < 20; i++) {
                let artistLetter = val.artists.items[i].name.substring(0,1).toLowerCase();
                let letterLetter = letter.toLowerCase();
                if (artistLetter === letterLetter) {
                    console.log("yes");
                    console.log(artistLetter);
                    artistsArr.push(val.artists.items[i].name);
                } else {
                    console.log("no");
                }
            }
            console.log(artistsArr);
        } else {
            console.log(err);
        }
    })
  }


  render() {
    if (!this.state.authenticated) {
      return (
        <a
          href={`https://accounts.spotify.com/authorize/?client_id=ac9ec319b658424d8aa1e41317e7c70f&response_type=token&redirect_uri=${window
            .location.origin +
            window.location
              .pathname}&scope=user-read-playback-state user-modify-playback-state user-top-read user-read-private`}
        >
          Login with Spotify
        </a>
      );
    }
    return (
        
      <div className="ui container">
        <button onClick={() => this.getArtists()}>Get Artists You Should Marry</button>
        <button onClick={() => this.searchArtists()}>Artists With The Same First Letter Of Name</button>

        <form className="ui form" onSubmit={this.onSubmit}>
          <input
            type="text"
            onChange={e => this.setState({ search: e.target.value })}
          />
          <input type="submit" value="Search" />
        </form>
        <div className="ui container six column grid">
          {this.state.songs.map(song => (
            <div
              className="ui one column card"
              key={song.id}
              onClick={e => this.startPlayback(song.id)}
            >
              <div className="image">
                <img src={song.album.images[0].url} />
              </div>
              <div className="content">
                <p className="header">{song.name}</p>
                <div className="meta">
                  <span className="date">
                    {song.artists.map(artist => artist.name).join(", ")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <select
          className="ui dropdown"
          onChange={e => this.setState({ currentDevice: e.target.value })}
        >
          {this.state.devices.map(device => (
            <option value={device.id}>{device.name}</option>
          ))}
        </select>
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

