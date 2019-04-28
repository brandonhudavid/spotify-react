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
import LabelElement from "./LabelElement";

import "./styles.css";
import { bigIntLiteral } from "@babel/types";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.display_name = '';
    this.topTracks = [];
    this.topTrackName = '';
    this.state = {
      authenticated: false,
      category: 2,
      songs: [],
      isPlaying: false,
      search: "",
      currentDevice: "",
      results: []
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

      await this.spotifyClient.getMyTopTracks(null, (err, val) => {
        if (!err) {
          var i; 
          for (i = 0; i < 20; i++) {
            this.topTracks.push(val.items[i].id)
          }
          this.topTrackName = val.items[0].name
        } else {
          console.log(err)
        }
      })
      this.renderCategory();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.category !== prevState.category) {
      console.log("current state category: " + this.state.category + "; prev: " + prevState.category);
      console.log("time to update!");
      this.renderCategory(this.state.category);
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


  async artistsToMarry() {
    console.log("getArtists");
    await this.spotifyClient.getMyTopArtists({limit:5}, (err, val) => {
        if (!err) {
          var artists = [];
          for (var i=0; i < val.items.length; i++) {
            artists.push(val.items[i].name);
          }
          this.setState({
            results: artists
          });
        } else {
            console.log(err);
        }
    });
  }
 
  async artistLetters() {
    const letter = this.display_name.substring(0, 1);
    console.log(letter)
    await this.spotifyClient.searchArtists(letter, {limit:50}, (err, val) => {
        if (!err) {
            var artistsArr = [];
            var i;
            for (i = 0; i < 50; i++) {
                let artistLetter = val.artists.items[i].name.substring(0,1).toLowerCase();
                let letterLetter = letter.toLowerCase();
                if (artistLetter === letterLetter) {
                    artistsArr.push(val.artists.items[i].name);
                    if (artistsArr.length == 5) {
                      break;
                    }
                }
            }
            this.setState({
              results: artistsArr
            })
        } else {
            console.log(err);
        }
    })
  }

  async musicalKey() {
    await this.spotifyClient.getAudioFeaturesForTrack(this.topTracks[0], (err, val) => {
        if (!err) {
          console.log(val)
          var key = val.key
          var dance = val.danceability
          var energy = val.energy
          var pitch = ['C', 'C#/D♭', 'D', 'D#/E♭', 'E', 'F',' F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B']
          console.log("Song: " + this.topTrackName)
          console.log("Key: " + pitch[key])
          console.log("Danceability: " + dance)
          console.log("Energy: " + energy)
        } else {
            console.log(err);
        }
    })
  }

  async searchPrime() {
    await this.spotifyClient.getMyTopTracks({limit: 50}, (err, val) => {
        if (!err) {
            var primeSongs = [];
            var i;
            for (i = 0; i < val.total; i++) {
                var songLength = Math.round(val.items[i].duration_ms / 1000);
                if (this.isPrime(songLength)) {
                  primeSongs.push([val.items[i].name, songLength])
                }
                if (primeSongs.length >= 5) {
                    break;
                }
            }
            this.setState({
              results: primeSongs
            })
        } else {
            console.log(err);
        }
    })
  }

  isPrime(num) {
    var sqrtnum=Math.floor(Math.sqrt(num));
      var prime = num != 1;
      for(var i=2; i<sqrtnum+1; i++) {
          if(num % i == 0) {
              prime = false;
              break;
          }
      }
      return prime;
  }

  async howExplicit() {
    var count = 0;
    await this.spotifyClient.getMyTopTracks({limit: 50}, (err, val) => {
        if (!err) {
            // console.log(val);
            var i;
            for (i = 0; i < 50; i++) {
                if (val.items[i].explicit) {
                    count++;
                }
            }
            this.setState({
              results: [count*2]
            })
        } else {
            console.log(err);
        }
    })
  }

  testRender(x) {
    if (x != 0) {
      return (
        <div>
          This is a test. X does not = 0.
        </div>
      )
    }
      return (
        <div>
          This is a test. X does not = 0.
        </div>
      )
  }

  renderResults() {
    return (<ul>{this.state.results.map(result =>
    <li>{result}</li>)}</ul>)
  }

  renderCategory(num) {
    switch(num) {
      case 1:
        this.artistsToMarry();
        break;
      case 2:
        this.artistLetters();
        break;
      case 3:
        this.searchPrime();
        break;
      case 4:
        this.howExplicit();
        break;
      default:
        break;
    }
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
        <button onClick={() => this.artistsToMarry()}>Get Artists You Should Marry</button>
        <button onClick={() => this.artistLetters()}>Artists With The Same First Letter Of Name</button>
        <button onClick={() => this.musicalKey()}>Musical Key</button>
        <button onClick={() => this.searchArtists()}>Songs You’ve Listened To That Are A Prime Number Of Seconds In Length</button>
        <button onClick={() => this.searchPrime()}>Prime Songs</button>
        <button onClick={() => this.howExplicit()}>How Explicit</button>

        <form className="ui form" onSubmit={this.onSubmit}>
          <input
            type="text"
            onChange={e => this.setState({ search: e.target.value })}
          />
          <input type="submit" value="Search" />
        </form>
        <div className="left arrow" onClick={() => {
          console.log("left arrow clicked");
          if (this.state.category > 1) {
            this.setState(prevState => ({
              category: prevState.category - 1
            }));
          }
        }}>
          Previous Category
        </div>
        <div className="right arrow" onClick={() => {
          console.log("right arrow clicked");
          if (this.state.category < 6) {
            this.setState(prevState => ({
              category: prevState.category + 1
            }));
          }
        }}>
          Next Category
        </div>
        <div>
          {this.renderResults()}
        </div>
        {/* <div className="ui container six column grid">
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
        </div> */}
        {/* <select
          className="ui dropdown"
          onChange={e => this.setState({ currentDevice: e.target.value })}
        >
          {this.state.devices.map(device => (
            <option value={device.id}>{device.name}</option>
          ))}
        </select> */}
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

