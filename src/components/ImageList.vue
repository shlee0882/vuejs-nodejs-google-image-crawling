<template>
  <div class="hello">
    <div><h3>입력한 키워드 : {{ keyWord }}</h3></div><br>
    <div id="myProgress"><div id="myBar">0%</div></div><br>
    <div><button @click="getImageList">GET 이미지 크롤링!!</button></div>
    <h3 id="imgTitle" style="text-align: left;"></h3>
    <div>
      <ul id="imageList1" style="text-align: left;">
      </ul>
    </div>
  </div>
</template>
<script>

import API_DATA from '@/API_DATA.js'

const GoogleImages = require('google-images');
let url = require('url');
let request = require('request');
let $ = require('jquery');
const fs = require('fs');
const axios = require('axios');
var JSZip = require("jszip");
var JSZipUtils = require("jszip-utils");

const client = new GoogleImages(API_DATA.csdID(), API_DATA.apiKey());

window.setImmediate = window.setTimeout;

export default {
  name: 'ImageList',
  props: {
    keyWord: String,
  },
  mounted() {
    let recaptchaScript = document.createElement('script')
    recaptchaScript.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/FileSaver.js')
    document.head.appendChild(recaptchaScript)
  },
  data() {
    return {
      imgList: [],
      pageStVal: 1,
      pageEndVal: 201,
      localWidth: "",
      clickOnce: false,
    };
  },
  methods: {
    getImageList() {
      window.vueComponent = this;
      self = window.vueComponent;
      if(this.keyWord == ""){
        alert("키워드를 입력하세요.");
        return;
      }
      $("#imgTitle").text("수집된 URL");
      if(!this.clickOnce){
        this.imgList = [];
        this.pageStVal = 1;
        this.pageEndVal = 201;
        $('#imageList1').empty();
        self.localWidth = "";
        self.searchFunc();
      }else{
        alert("크롤링 중입니다. 잠시만 기달려주세요.");
      }
    },
    searchFunc() {
        self.clickOnce = true;
        client.search(this.keyWord,  {page: self.pageStVal, size: 'large'})
            .then(images => {
            images.forEach(img => {
                let filePath = url.parse(img.url).pathname;
                let newFilePath = filePath.replace(/[^a-zA-Z0-8\.]+/g, '_');
                let pattern = /\.(jpg|png|gif)\b/; 
                // 파일길이가 200 미만이고 이미지 파일인지 체크
                if(newFilePath.length<200 && pattern.test(newFilePath)){
                    $( "#imageList1" ).append( "<li>"+img.url+"</li>" );
                    this.downloadImg(img.url, img.description);
                };
            });
            this.compareTwoVal();
        }).catch(error => {
            console.log(">>>>>>>>>>>>>>>>>>>"+error);
            console.log("모든 이미지를 수집했습니다.1");
            this.make_zip();
            return false;
        });
    },
    compareTwoVal(){
        if(self.pageStVal<self.pageEndVal){
            setTimeout(function() {
                self.pageStVal += 10;
                if(self.localWidth != "100"){
                  self.progressBar();
                }
                console.log("pageStVal: >>>>>>>>"+self.pageStVal);
                self.searchFunc(self.pageStVal,self.pageEndVal);
            }, 500);
        }else{
            console.log("모든 이미지를 수집했습니다.2");
            this.make_zip();
            return;
        }
    },
    make_zip() {
      var zip = new JSZip();

      if(self.imgList.length == 0){
        setTimeout(function() {
          return self.make_zip();
        }, 500);
      }

      if(self.imgList.length > 0){
        for(var i=0; i<self.imgList.length; i++){
          zip.file(self.imgList[i].description, this.urlToPromise(self.imgList[i].url), {binary:true});
        }

        zip.generateAsync({type:"blob"})
        .then(function(content) {
            saveAs(content, self.keyWord+".zip");
        }, function(err){
            console.log(err)
        });
        self.clickOnce = false;
      }else{
        return;
      }
    },

    downloadImg(imgUrl, description) {
      axios(
        {
            url: imgUrl,
            responseType: 'blob',
        }
        ).then((response) => {
              var blobData = new Blob([response.data]);
              console.log(blobData);
              var fileURL = window.URL.createObjectURL(new Blob([response.data]));
              var fileLink = document.createElement('a');

              fileLink.href = fileURL;
              fileLink.setAttribute('download', description+'.jpg');
              document.body.appendChild(fileLink);
              var jsonData = {"url":fileURL, "description":description+'.jpg'};
              self.imgList.push(jsonData);
              console.log(fileLink);
              // fileLink.click();
        });
    },

    urlToPromise(url) {
      return new Promise(function(resolve, reject) {
          JSZipUtils.getBinaryContent(url, function (err, data) {
              if(err) {
                  reject(err);
              } else {
                  resolve(data);
              }
          });
      });
    },

    progressBar() {
      var elem = document.getElementById("myBar");
      self.localWidth = Math.floor(self.pageStVal / 2).toString();
      if(Number(self.localWidth) >= 100){
        elem.style.width = "100%";
        elem.innerHTML = "100%";
      }else{
        elem.style.width = self.localWidth + "%";
        elem.innerHTML = self.localWidth + "%";
      }
    }
  },
};


</script>

<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}

#myProgress {
  background-color: grey;
  margin: auto;
  width: 50%;
  padding: 10px;
}

#myBar {
  width: 10%;
  height: 30px;
  background-color: #4CAF50;
  text-align: center; /* To center it horizontally (if you want) */
  line-height: 30px; /* To center it vertically */
  color: white;
}
</style>
