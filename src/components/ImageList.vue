<template>
  <div class="hello">
    <div><h3>입력한 키워드 : {{ keyWord }}</h3></div><br>
    <div id="myProgress">
      <span id="mySpan" style="color: white;font-family: auto;"></span>
      <div id="myBar">0%</div>
    </div><br>
    <div><button @click="getImageList">GET 이미지 크롤링!!</button></div>
    <h3 id="imgTitle" style="text-align: left;"></h3>
    <div>
      <ul id="imageList1" style="text-align: left;">
      </ul>
    </div>
  </div>
</template>
<script>

import API_DATA from '@/API_DATA';
const GoogleImages = require('google-images');
let url = require('url');
let request = require('request');
let $ = require('jquery');
const fs = require('fs');
const axios = require('axios');
var JSZip = require("jszip");
var JSZipUtils = require("jszip-utils");

const client = new GoogleImages(csdID, apiKey);


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
      tempImgList : [],
      imgList: [],
      pageStVal: 1,
      pageEndVal: 201,
      localWidth: "",
      clickOnce: false,
      valCnt : 0,
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
        document.getElementById("mySpan").textContent = "현재 크롤링 진행률 : "+Math.floor(0.5*this.pageStVal)+"% 입니다.";
        client.search(self.keyWord,  {page: self.pageStVal, size: 'large'})
            .then(images => {
            for(let cnt=0; cnt<images.length; cnt++){
              let img = images[cnt];
              self.valCnt = cnt;
              let filePath = url.parse(img.url).pathname;
              let newFilePath = filePath.replace(/[^a-zA-Z0-8\.]+/g, '_');
              let pattern = /\.(jpg|jpeg|png|gif)\b/; 
              // 파일길이가 200 미만이고 이미지 파일인지 체크
              if(newFilePath.length<200 && pattern.test(newFilePath)){
                  $( "#imageList1" ).append( "<li>"+img.url+"</li>" );
                  let data = {"imgUrl" : img.url, "imgDescription" : img.description}
                  self.tempImgList.push(data);
              };
            }
            self.compareTwoVal();
        }).catch(error => {
            console.log(error);
            self.compareTwoVal()
        });
    },
    compareTwoVal(){
      if(self.pageStVal<self.pageEndVal){
        self.pageStVal += 10;
        console.log("pageStVal: >>>>>>>>"+self.pageStVal);
        self.searchFunc(self.pageStVal,self.pageEndVal);
      }else{
          console.log("모든 이미지를 수집했습니다.2");
          this.fetchSomeThing(0);
          return;
      }
    },
    fetchSomeThing(cnt) {
      if(self.tempImgList[cnt] != null){
        let img = self.tempImgList[cnt];
        let tempList = self.tempImgList;
        this.getBase64FromUrl(img.imgUrl, img.imgDescription).then(result=>{
          cnt++;
          if(cnt == tempList.length-1){
            self.make_zip();
          }else{
            self.fetchSomeThing(cnt);   
          }
        });
        if(self.localWidth != "100"){
            self.progressBar(cnt);
        }
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
        let elem = document.getElementById("myBar");
        elem.style.width = "100%";
        elem.innerHTML = "100%";
        document.getElementById("mySpan").textContent = "이미지 파일로 변환완료";
        self.clickOnce = false;
      }else{
        return;
      }
    },
    getBase64FromUrl : async (imgUrl, description) => {
      let calculImgUrl = myHerokuUrl + imgUrl;
      const data = await fetch(calculImgUrl);
      const blobData = await data.blob();
      return new Promise((resolve) => {
          var fileURL = window.URL.createObjectURL(new Blob([blobData]));
          var fileLink = document.createElement('a');
          fileLink.href = fileURL;
          fileLink.setAttribute('download', description+'.jpg');
          document.body.appendChild(fileLink);
          var jsonData = {"url":fileURL, "description":description+'.jpg'};
          resolve(self.imgList.push(jsonData));
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
    progressBar(num) {
      var elem = document.getElementById("myBar");
      self.localWidth = parseFloat((100 / self.tempImgList.length)).toFixed(1).toString();
      let percentage = parseFloat(Number(self.localWidth)*Number(num)).toFixed(1)
      if(percentage >= 100.0){
        elem.style.width = "100%";
        elem.innerHTML = "100%";
        document.getElementById("mySpan").textContent = "이미지 파일로 변환완료";
      }else{
        elem.style.width = percentage+"%";
        elem.innerHTML = percentage+"%";
        document.getElementById("mySpan").textContent = "이미지 파일로 변환 중: "+percentage+"% 입니다.";
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
