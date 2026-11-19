// magazine 版 MDX 元件：CardSpec 換成圖文介紹區塊，其餘沿用
import CardLink from '@/components/content/CardLink.astro';
import TermLink from '@/components/content/TermLink.astro';
import MagCardSpec from './MagCardSpec.astro';

export const magMdxComponents = { CardLink, CardSpec: MagCardSpec, TermLink };
