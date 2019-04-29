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
    this.artistsToMarryRes = [];
    this.artistLettersRes = [];
    this.primeSongsRes = [];
    this.howExplicitRes = [];
    this.display_name = '';
    this.topTracks = [];
    this.topTrackName = '';
    this.topTrackArtist = '';
    this.state = {
      authenticated: false,
      category: 1,
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
          this.topTrackArtist = val.items[0].artists[0].name

        } else {
          console.log(err)
        }
      })
      this.renderCategory(this.state.category);
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
    if (this.artistsToMarryRes.length > 0) {
      this.setState({
        results: this.artistsToMarryRes
      })
    } else {
      await this.spotifyClient.getMyTopArtists({limit:5}, (err, val) => {
          if (!err) {
            var artists = [];
            for (var i=0; i < val.items.length; i++) {
              artists.push(val.items[i].name);
            }
            this.artistsToMarryRes = artists;
            this.setState({
              results: artists
            });
          } else {
              console.log(err);
          }
      });
    }
  }
 
  async artistLetters() {
    if (this.artistLettersRes.length > 0) {
      this.setState({
        results: this.artistLettersRes
      })
    } else {
      const letter = this.display_name.substring(0, 1);
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
              this.artistLettersRes = artistsArr;
              this.setState({
                results: this.artistLettersRes
              })
          } else {
              console.log(err);
          }
      })
    }
  }

  async musicalKey() {
    await this.spotifyClient.getAudioFeaturesForTrack(this.topTracks[0], (err, val) => {
        if (!err) {
          console.log(val)
          var key = val.key
          var dance = val.danceability
          var energy = val.energy
          var pitch = ['C', 'C#/D♭', 'D', 'D#/E♭', 'E', 'F',' F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B']

          var musicalArr = ["Your Top Song: " + this.topTrackName + ' by ' + this.topTrackArtist, "Key: " + pitch[key], "Danceability: " + dance, "Energy: " + energy]
          this.setState({
            results: musicalArr
          })
        } else {
            console.log(err);
        }
    })
  }

  async searchPrime() {
    if (this.primeSongsRes.length > 0) {
      this.setState({
        results: this.primeSongsRes
      })
    } else {
      await this.spotifyClient.getMyTopTracks({limit: 50}, (err, val) => {
          if (!err) {
              var primeSongs = [];
              var i;
              for (i = 0; i < val.total; i++) {
                  var songLength = Math.round(val.items[i].duration_ms / 1000);
                  if (this.isPrime(songLength)) {
                    primeSongs.push(val.items[i].name + " (" + this.secondsToMinutes(songLength) + ")");
                  }
                  if (primeSongs.length >= 5) {
                      break;
                  }
              }
              this.primeSongsRes = primeSongs;
              this.setState({
                results: this.primeSongsRes
              })
          } else {
              console.log(err);
          }
      })
    }
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
    if (this.howExplicitRes.length > 0) {
      this.setState({
        results: this.howExplicitRes
      })
    } else {
      var count = 0;
      await this.spotifyClient.getMyTopTracks({limit: 50}, (err, val) => {
          if (!err) {
              var i;
              for (i = 0; i < 50; i++) {
                  if (val.items[i].explicit) {
                      count++;
                  }
              }
              this.howExplicitRes = [count*2 + "%"]
              this.setState({
                results: this.howExplicitRes
              })
          } else {
              console.log(err);
          }
      })
    }
  }
  async tedTalk() {
    this.setState({results: []})
  }

  secondsToMinutes(x) {
    var min = Math.floor(x/60);
    var sec = x % min;
    return min + "m " + sec + "s";
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
        this.musicalKey();
        break;
      case 5:
        this.howExplicit();
        break;
      case 6:
        this.tedTalk();
        break;
      default:
        break;
    }
  }

  renderTitle() {
    switch(this.state.category) {
      case 1:
        return "Artists You Should Marry";
      case 2:
        return "Artists With The Same First Letter Of Your First Name";
      case 3:
        return "Prime Songs";
      case 4:
        return "Musical Information You Didn't Need To Know But Here It Is Anyways";
      case 5:
        return "How Explicit Are You?";
      case 6:
        return "Thanks for coming to our Ted Talk. Hope you learned something about your listening! - Brandon & Megan";
      default:
        break;
    }
  }

  render() {
    if (!this.state.authenticated) {
      return (
        <div className="App">
          <div className="title">
            When You Open Your Spotify Application On Your Mobile Device Or Desktop And You Choose To Listen To Your Favorite Music, What Does Said Music Say About You
          </div>
          <a
            href={`https://accounts.spotify.com/authorize/?client_id=ac9ec319b658424d8aa1e41317e7c70f&response_type=token&redirect_uri=${window
              .location.origin +
              window.location
                .pathname}&scope=user-read-playback-state user-modify-playback-state user-top-read user-read-private`}
          >
            Login with Spotify
          </a>
        </div>
      );
    }
    return (
      <div className="App">
      <div className="ui container">
      <img src={"./left-arrow.png"} />
        <div className="left arrow" onClick={() => {
          console.log("left arrow clicked");
          if (this.state.category > 1) {
            this.setState(prevState => ({
              category: prevState.category - 1
            }));
          }
        }}><img src={"/img/left-arrow.png"} alt="left arrow" />
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
        <div style={{height: 100 + 'px'}} />
        <div className="title">
          {this.renderTitle()}
        </div>
        <div className="results">
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
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

