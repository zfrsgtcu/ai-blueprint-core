import { browser } from '$app/environment';
import { goto } from '$app/navigation';

/** @type {import('@sveltejs/kit').ClientInit} */
export const init = async () => {
  // Client tarafında başlangıç işlemleri
  if (browser) {
    console.log('{{ProjectName}} başlatıldı');
  }
};
