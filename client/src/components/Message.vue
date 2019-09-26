<template>
    <li v-bind:class="{msgcontainer: true, leftpad: mine, rightpad: !mine }">
        <div v-bind:class="{'message-data': true, 'align-right': mine }">
            <span class="message-data-name"><i class="fa fa-circle online"></i> {{sender}}</span>
            <span class="message-data-time">{{ time }}</span>
        </div>
        <div v-bind:class="{message: true, 'my-message': mine, 'other-message': !mine}">
            {{msg}}
        </div>
    </li>
</template>

<script>
export default {
    name: 'Message',
    props: {
        msg: String,
        sender: String,
        time: String,
        mine: Boolean
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">

    $green: #86BB71;
    $blue: #94C2ED;
    $orange: #E38968;
    $gray: #92959E;

    .msgcontainer {
        color: #434651;
    }

    .leftpad {
        padding-left: 40px;
    }

    .rightpad {
        padding-right: 40px;
    }


    .message-data {
        margin-bottom: 15px;
    }
    
    .message-data-time {
        color: lighten($gray, 8%);
        padding-left: 6px;
    }
    
    .message {      
        color: white;
        padding: 18px 20px;
        line-height: 26px;
        font-size: 16px;
        border-radius: 7px;
        margin-bottom: 30px;
        position: relative;

        &:after {
            bottom: 100%;
            left: 93%;
            border: solid transparent;
            content: " ";
            height: 0;
            width: 0;
            position: absolute;
            pointer-events: none;
            border-bottom-color: $blue;
            border-width: 10px;
            margin-left: -10px;
        }
    }
    
    .my-message {
        background: $blue;
    }
    
    .other-message {
        background: $green;

        &:after {
            border-bottom-color: $green;
            left: 7%;
        }
    }


    .align-right {
        text-align: right;
    }

</style>
