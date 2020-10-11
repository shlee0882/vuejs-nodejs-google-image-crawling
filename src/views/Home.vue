<template>
  <div class="home">
    <h1>구글 서치엔진에서 이미지 가져오기</h1>
    <input v-model="keyWord" placeholder="검색할 키워드를 입력하세요." style="width: 25%; font-size: 25px;">
    <image-list :keyWord="keyWord"></image-list>
  </div>
</template>

<script>

import ImageList from '@/components/ImageList.vue';

export default {
  components: {
    'image-list': ImageList,
  },
  data() {
    return {
      keyWord: '',
    };
  }
};

</script>