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
    this.musicalKeyRes = [];
    this.howExplicitRes = [];
    this.display_name = '';
    this.topTracks = [];
    this.topTrackName = '';
    this.topTrackArtist = '';
    this.guessArr = [];
    this.topTrackArtistURL = '';
    this.topTrackAlbum = '';
    this.letterimage = '';
    this.artistImages = ['', '', '', '', '', ''];
    this.redirect_uri = "";
    
    this.state = {
      authenticated: false,
      category: 1,
      songs: [],
      isPlaying: false,
      search: "",
      currentDevice: "",
      results: [],
      explicitText: "",
      artistImage: ''
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
        // currentDevice: devices[0].id
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
          this.topTrackAlbum = val.items[0].album.images[0].url

        } else {
          console.log(err)
        }
      })
      this.getArtistsToMarry();
      this.getArtistLetters();
      this.getMusicalKey();
      this.getPrime();
      this.calculateExplicit();
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


  async getArtistsToMarry() {
    await this.spotifyClient.getMyTopArtists({limit:5}, (err, val) => {
      if (!err) {
        var artists = [];
        for (var i=0; i < val.items.length; i++) {
          artists.push(val.items[i].name);
        }
        this.artistsToMarryRes = artists;
        this.topTrackArtistURL = val.items[0].images[0].url;
        this.artistImages[0] = this.topTrackArtistURL;
        if (this.state.category == 1) {
          this.setState({
            results: this.artistsToMarryRes,
            artistImage: this.artistImages[0]
          })
        }
      } else {
          console.log(err);
      }
    })
  }

  artistsToMarry() {
    if (!(this.artistsToMarryRes.length > 0)) {
      this.getArtistsToMarry();
    }
    this.setState({
      results: this.artistsToMarryRes,
      artistImage: this.artistImages[0]
    })
  }

  async getArtistLetters() {
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
                  this.letterimage = val.artists.items[i].images[0].url;
                  if (artistsArr.length == 5) {
                    break;
                  }
              }
          }
          this.artistLettersRes = artistsArr;
          this.artistImages[1] = this.letterimage;
          if (this.state.category == 2) {
            this.setState({
              results: this.artistLettersRes,
              artistImage: this.artistImages[1]
            })
          }
      } else {
          console.log(err);
      }
    })
  }
 
  artistLetters() {
    if (!(this.musicalKeyRes.length > 0)) {
      this.getArtistLetters();
    }
    this.setState({
      results: this.artistLettersRes,
      artistImage: this.artistImages[1]
    })
  }

  async getMusicalKey() {
    await this.spotifyClient.getAudioFeaturesForTrack(this.topTracks[0], (err, val) => {
      if (!err) {
        console.log(val)
        var key = val.key
        var dance = val.danceability
        var energy = val.energy
        var pitch = ['C', 'C#/D♭', 'D', 'D#/E♭', 'E', 'F',' F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B']

        var musicalArr = ["Your Top Song: " + this.topTrackName + ' by ' + this.topTrackArtist, "Key: " + pitch[key], "Danceability: " + dance, "Energy: " + energy]
        this.musicalKeyRes = musicalArr;
        this.artistImages[3] = this.topTrackAlbum;
          if (this.state.category == 4) {
            this.setState({
              results: this.musicalKeyRes,
              artistImage: this.artistImages[3]
            })
          }
      } else {
          console.log(err);
      }
    })
  }

  musicalKey() {
    if (!(this.musicalKeyRes.length > 0)) {
      this.getMusicalKey();
    }
    this.setState({
      results: this.musicalKeyRes,
      artistImage: this.artistImages[3]
    })
  }

  async getPrime() {
    await this.spotifyClient.getMyTopTracks({limit: 50}, (err, val) => {
      if (!err) {
          var primeSongs = [];
          var image = ''
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
          if (this.state.category == 3) {
            this.setState({
              results: this.primeSongsRes,
              artistImage: ""
            })
          }
        } else {
            console.log(err);
        }
    })
  }
  
  searchPrime() {
    if (!(this.primeSongsRes.length > 0)) {
      this.getPrime();
    }
    this.setState({
      results: this.primeSongsRes
    })
  }

  isPrime(number)
 { 
   if (number <= 1)
   return false;

   // The check for the number 2 and 3
   if (number <= 3)
   return true;

   if (number%2 == 0 || number%3 == 0)
   return false;

   for (var i=5; i*i<=number; i=i+6)
   {
      if (number%i == 0 || number%(i+2) == 0)
      return false;
   }

   return true;
 }

  async calculateExplicit() {
    var count = 0;
      await this.spotifyClient.getMyTopTracks({limit: 50}, (err, val) => {
          if (!err) {
              var i;
              for (i = 0; i < 50; i++) {
                  if (val.items[i].explicit) {
                      count++;
                  }
              }
              this.howExplicitRes = [count*2];
              if (this.state.category == 5) {
                this.setState({
                  results: this.howExplicitRes
                })
              }
          } else {
              console.log(err);
          }
      })
  }

  howExplicit() {
    if (!(this.howExplicitRes.length > 0)) {
      this.calculateExplicit();
    }
    this.setState({
      results: this.howExplicitRes
    })
  }

  async tedTalk() {
    this.setState({results: [<img src = "https://lh3.google.com/u/0/d/1DUT0VRTAihNdeZh38Gne4bAY-cKfFSDk=w2880-h1532-iv1" />]})
  }

  secondsToMinutes(x) {
    var min = Math.floor(x/60);
    var sec = x % min;
    return min + "m " + sec + "s";
  }

  shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  }

  explicitGuesses() {
    var answer = this.howExplicitRes[0];
    console.log("answer: " + answer);
    var guess1 = Math.floor((Math.random() * 100));
    while (Math.abs(answer - guess1) < 10) {
      guess1 = Math.floor((Math.random() * 100));
    }
    var guess2 = Math.floor((Math.random() * 100));
    while (Math.abs(answer - guess2) < 10 || Math.abs(guess1 - guess2) < 10) {
      guess2 = Math.floor((Math.random() * 100));
    }
    this.guessArr = this.shuffle([answer, guess1, guess2])
  }

  checkExplicit(x) {
    if (x === this.howExplicitRes[0] + "%") {
      console.log("guessed correctly!");
      this.setState({
        explicitText: "You got it! You are " + x + " explicit!"
      })
    } else {
      console.log("guessed wrong!");
      this.setState({
        explicitText: "Try again!"
      })
    }
  }

  showPercents(x) {
    if (this.guessArr[x]) {
      return this.guessArr[x];
    }
    return this.howExplicitRes[0];
  }

  renderResults() {
    if (this.state.category == 5) {
      if (this.guessArr.length != 3) {
        this.explicitGuesses();
      }
      return (
        <div>
        <div class="results" style={{marginBottom: 100 + 'px'}}>Guess how explicit your top 50 songs are!</div>
        <div class="ui grid">
          <div class="three column row">
            <div class="column">
              <button class="ui yellow button" onClick={() => {this.checkExplicit(this.showPercents(0) + "%")}}>
                {this.showPercents(0) + "%"}
              </button>
            </div>
            <div class="column">
              <button class="ui yellow button" onClick={() => {this.checkExplicit(this.showPercents(1) + "%")}}>
              {this.showPercents(1) + "%"}
              </button>
            </div>
            <div class="column">
              <button class="ui yellow button" onClick={() => {this.checkExplicit(this.showPercents(2) + "%")}}>
              {this.showPercents(2) + "%"}
              </button>
            </div>
          </div>
          <div className="results">{this.state.explicitText}</div>
        </div>
        </div>
      )
    }
    return (
    <div class="ui grid">
      <div class="two column row">
        <div class="column">
          <ul>{this.state.results.map(result =>
            <li>{result}</li>)}
          </ul>
        </div>
        <div class="column">
          {/* <img src = {this.state.artistImage} width={250} style={{verticalAlign: "left"}}/> */}
          <div className = {"image" + this.state.category}>
          <img src = {this.artistImages[this.state.category-1]} width={400} />
          </div>
        </div>
      </div>

    </div>
    
    )
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
        return "Artists You Should Highly Consider Marrying";
      case 2:
        return "Artists With The Same First Letter Of Your First Name";
      case 3:
        return "Songs You Listened To That Are A Prime Number Of Seconds In Length";
      case 4:
        return "Musical Information You Didn't Need To Know But Here It Is Anyways";
      case 5:
        return "How Explicit Are You?";
      case 6:
        return " ";
      default:
        break;
    }
  }

  render() {
    if (!this.state.authenticated) {
      return (
        <div className="App">
          <div className="coverpage">
          <div className="coverchild">
            When You Open Your Spotify Application On Your Mobile Device Or Desktop And You Choose To Listen To Your Favorite Music, What Does Said Music Say About You
          </div></div>
          <div className = "loginbutton">
          <a
            href={`https://accounts.spotify.com/authorize/?client_id=390641f619b14b1581aaadd96df6bbb8&response_type=token&redirect_uri=http://vibrant-lamport-7c4035/callback/&scope=user-read-playback-state user-modify-playback-state user-top-read user-read-private`}
          >
            <img src={"https://lh3.google.com/u/0/d/118tOtCTdLNH0xdj0BZe-8zwaOzEaVq1y=w2846-h1434-iv1"} width="300"/>
          </a>
          </div>


        </div>
      );
    }
    return (
      <div className={"App App" + this.state.category}>
      <div className="ui container">
        <div className="left arrow" onClick={() => {
          console.log("left arrow clicked");
          if (this.state.category > 1) {
            this.setState(prevState => ({
              category: prevState.category - 1
            }));
          }
        }}>
        <img src={"https://lh3.google.com/u/0/d/1-575M8mAa3hl6fj2mvr9ED55eLZZFyTO=w2056-h1532-iv1"} width="30" alt="left arrow" />
            
        </div>
        <div className="right arrow" onClick={() => {
          console.log("right arrow clicked");
          if (this.state.category < 6) {
            this.setState(prevState => ({
              category: prevState.category + 1
            }));
          }
        }}>
          <img src = {"https://lh3.google.com/u/0/d/1MFEpOZARuWjANKEYN50btH2Q_ol_oPJq=w2120-h1532-iv1"} width="30" alt="right arrow"/>
        </div>
        <div style={{height: 100 + 'px'}} />
        <div className={"title title" + this.state.category}>
          <div className={"titlechild"}>
            {this.renderTitle()}
          </div>
        </div>
        <div className={"results results" + this.state.category}>
          {this.renderResults()}
      </div>
      </div>
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

