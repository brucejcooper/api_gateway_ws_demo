<template>
  <div id="app">
    <div class="container clearfix">
        <div class="people-list" id="people-list">
            <ul class="list">
                <li v-for="user in users" v-bind:key="user.id" class="clearfix">
                    <img v-bind:src="'https://s3-us-west-2.amazonaws.com/s.cdpn.io/195612/chat_avatar_0' + user.id + '.jpg'" alt="avatar" />
                    <div class="about">
                    <div class="name">{{user.name}}</div>
                    <!-- <div class="status">
                        <i class="fa fa-circle online"></i> online
                    </div> -->
                    </div>
                </li>
            </ul>
        </div>

        <div class="chat">
            <div class="chat-header clearfix">
                <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/195612/chat_avatar_01_green.jpg" alt="avatar" />
                
                <div class="chat-about">
                <div class="chat-with"> Chat Room</div>
                <div class="chat-num-messages"> messages</div>
                </div>
                <i class="fa fa-star"></i>
            </div> <!-- end chat-header -->
            
            <div ref="chathistory" class="chat-history">
                <ul>
                  <Message v-for="message in messages" v-bind:key="message.id" v-bind:msg="message.message" v-bind:sender="message.sender" v-bind:time="message.time" v-bind:mine="message.sender === me"/>
                </ul>
            </div> <!-- Chat History -->

            <div class="chat-message clearfix">
                <input type="text" ref="msgbox" placeholder ="Type your message" v-on:keyup.enter="sendMsg" v-model="msgboxtxt"/>
                <button v-on:click="sendMsg">Send</button>
            </div> <!-- end chat-message -->

        </div>   
    </div>
  </div>
</template>

<script>
import Message from './components/Message.vue'

function uuid() {
    function randomDigit() {
        if (crypto && crypto.getRandomValues) {
            var rands = new Uint8Array(1);
            crypto.getRandomValues(rands);
            return (rands[0] % 16).toString(16);
        } else {
            return ((Math.random() * 16) | 0).toString(16);
        }
    }
    var crypto = window.crypto || window.msCrypto;
    return 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, randomDigit);
}


var data = {
  messages: [ ],
  me: "Bruce",
  users: [ ],
  msgboxtxt: ""
};

export default {
  name: 'app',
  components: {
    Message
  },
  data: function() {
    return data;
  },

  methods: {
    sendMsg: function(event) {
      if (this.msgboxtxt) {
        this.socket.send(this.msgboxtxt);
        this.msgboxtxt = "";
      } else {
        alert("No text");
      }

    }
  },

  created: function() {
    console.log("This data is ", this);
    let socket = new WebSocket('wss://9kmmj8ds4a.execute-api.ap-southeast-2.amazonaws.com/devo');
    this.socket = socket;
    let vueobj = this;
    console.log(vueobj);
    socket.addEventListener('open', (event) => {
      console.log(("Connected. Sending person list request"));
      socket.send(JSON.stringify({"action": "personListReq"}));
    });
    socket.addEventListener('message', (event) => {
      let parsed = JSON.parse(event.data);
      switch (parsed.type) {
        case 'participants':
          this.users = parsed.participants.map((id, index) => { return { id: index+1, name: id, state: "online" } });
          this.me = parsed.connectionId;
          break;
        case 'message':
          this.messages.push({
            id: uuid(),
            message: parsed.message,
            sender: parsed.author,
            time: new Date().toLocaleTimeString()
          })
          // let container = this.$el.querySelector(".chat-history");
          this.$nextTick(() => {
            let container = this.$refs.chathistory;
            container.scrollTop = container.scrollHeight;
          });

          break;
        default:
          console.log("Received non-usable message:", parsed);
      }
    });

    // Every few seconds, refresh the person list. Saves fiddling with subscription listening and potential missed messages
    this.refreshTimer = setInterval(()=> {
      socket.send(JSON.stringify({"action": "personListReq"}));
    }, 5000);


    // Focus on the text box when we load.
    this.$nextTick(() => {
      this.$refs.msgbox.focus();
    });
  },

  beforeDestroy: function() {
    console.log("Closing websocket");
    this.socket.close();
    clearInterval(this.refreshTimer);
  }


}
</script>

<style lang="scss">
@import url(https://fonts.googleapis.com/css?family=Lato:400,700);

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #C5DDEB;
  font: 14px/20px "Lato", Arial, sans-serif;
  padding: 40px 0;
  color: white;
  height: 100%;
  box-sizing: border-box;
}

ul {
    list-style: none;
    padding: 0;
}

html, body, .viewport {
  width: 100%;
  height: 100%;
  margin: 0;
}



@import url(https://fonts.googleapis.com/css?family=Lato:400,700);

$green: #86BB71;
$blue: #94C2ED;
$orange: #E38968;
$gray: #92959E;

*, *:before, *:after {
  box-sizing: border-box;
}

.container {
  margin: 0 auto;
  width: 750px;
  background: #444753;
  border-radius: 5px;
  display: flex;
  flex-direction: row;
  height: 100%;
  flex: 1;
}


.people-list {
  width:260px;
  overflow-y: scroll;
  
  .search {
    padding: 20px;
  }
  
  input {
    border-radius: 3px;
    border: none;
    padding: 14px;
    color: white;
    background: #6A6C75;
    width: 90%;
    font-size: 14px;
  }
  
  .fa-search {
    position: relative;
    left: -25px;
  }
  
  ul {
    padding: 20px;
    list-style: none;

    li {
      padding-bottom: 20px;
      display: flex;
      flex-direction: row;
      align-items: flex-start;
    }
  }
  
  
  .about {
    margin-top: 8px;
  }
  
  .about {
    padding-left: 8px;
  }
  
  .status {
    color: $gray;
  }
  
}

.chat {
  width: 490px;
  background: #F2F5F8;
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
  display: flex;
  flex-direction: column;
  
  color: #434651;
  
  .chat-header {
    padding: 20px;
    border-bottom: 2px solid white;
    
    img {
      float: left;
    }
    
    .chat-about {
      float: left;
      padding-left: 10px;
      margin-top: 6px;
    }
    
    .chat-with {
      font-weight: bold;
      font-size: 16px;
    }
    
    .chat-num-messages {
      color: $gray;
    }
    
    .fa-star {
      float: right;
      color: #D8DADF;
      font-size: 20px;
      margin-top: 12px;
    }
  }
  
  .chat-history {
    padding: 30px 10px 20px;
    border-bottom: 2px solid white;
    overflow-y: scroll;
    flex: 1;
  }
  
  .chat-message {
    padding: 5px 20px;
    display: flex;
    flex-direction: row;
    
    input {
      width: 100%;
      border: none;
      padding: 10px 20px;
      font: 14px/22px "Lato", Arial, sans-serif;
      border-radius: 5px;
      resize: none;
      flex: 1
      
    }
    
    .fa-file-o, .fa-file-image-o {
      font-size: 16px;
      color: gray;
      cursor: pointer;
      
    }
    
    button {
      float: right;
      color: $blue;
      font-size: 16px;
      text-transform: uppercase;
      border: none;
      cursor: pointer;
      font-weight: bold;
      background: #F2F5F8;
      
      &:hover {
        color: darken($blue, 7%);
      }
    }
  }
}

.online, .offline, .me {
    margin-right: 3px;
    font-size: 10px;
  }
  
.online {
  color: $green;
}
  
.offline {
  color: $orange;
}

.me {
  color: $blue;
}

.align-left {
  text-align: left;
}

.align-right {
  text-align: right;
}

.float-right {
  float: right;
}

.clearfix:after {
	visibility: hidden;
	display: block;
	font-size: 0;
	content: " ";
	clear: both;
	height: 0;
}


</style>
