# Vue笔记

## vue自定义指令

1. v-animate 动画指令，实现元素在视口内执行动画/也可以实现图片懒加载

```ts

import type { App } from 'vue';
// 指令
export const defineDirective = (app:App) => {
  // 元素滚动动画
  app.directive('animate', {
    mounted (el, binding) {
      const observer = new IntersectionObserver(([{ isIntersecting }]) => {
        if (isIntersecting) {
            // 在可视范围内即可取消监听
          observer.unobserve(el)
          el.classList.add('animate__animated')
          el.classList.add(binding.value)
        }
      }, {
          // 设置监控距离为 图片和可视区域交叉距离为 0.01 时加载图片
        threshold: 0.01
      })
      // 监听绑定的dom元素
      observer.observe(el)
    }
  })
  // 元素hover动画
  app.directive('hover', {
    mounted (el, binding) {
        el.onmouseover=()=>{
            el.classList.add('animate__animated')
            el.classList.add(binding.value)
        }
        el.onmouseout=()=>{
            el.classList.remove('animate__animated')
            el.classList.remove(binding.value)
        }
    }
  })
}

// 使用
 <div v-animate="'animate__fadeInUp'" />
//hover 的使用同上
```
2. v-auth 鉴权指令，常用于后台管理系统按钮权限
```ts
import type { App } from 'vue';
import { useUserInfo } from '/@/stores/userInfo';
import { judementSameArr } from '/@/utils/arrayOperation';

/**
 * 用户权限指令
 * @directive 单个权限验证（v-auth="xxx"）
 * @directive 多个权限验证，满足一个则显示（v-auths="[xxx,xxx]"）
 * @directive 多个权限验证，全部满足则显示（v-auth-all="[xxx,xxx]"）
 */
export function authDirective(app: App) {
	// 单个权限验证（v-auth="xxx"）
	app.directive('auth', {
		mounted(el, binding) {
			const stores = useUserInfo();
			if (!stores.userInfos.authBtnList.some((v: string) => v === binding.value)) el.parentNode.removeChild(el);
		},
	});
	// 多个权限验证，满足一个则显示（v-auths="[xxx,xxx]"）
	app.directive('auths', {
		mounted(el, binding) {
			let flag = false;
			const stores = useUserInfo();
			stores.userInfos.authBtnList.map((val: string) => {
				binding.value.map((v: string) => {
					if (val === v) flag = true;
				});
			});
			if (!flag) el.parentNode.removeChild(el);
		},
	});
	// 多个权限验证，全部满足则显示（v-auth-all="[xxx,xxx]"）
	app.directive('auth-all', {
		mounted(el, binding) {
			const stores = useUserInfo();
			const flag = judementSameArr(binding.value, stores.userInfos.authBtnList);
			if (!flag) el.parentNode.removeChild(el);
		},
	});
}
```
待完善....
