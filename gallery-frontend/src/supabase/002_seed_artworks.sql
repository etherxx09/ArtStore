-- 藏品数据批量导入
-- 执行方式：Supabase Dashboard → SQL Editor → 粘贴执行

-- 清理旧数据（如需保留已有数据，请注释掉这两行）
-- DELETE FROM public.artworks;

-- 禁用触发器以加速批量插入
ALTER TABLE public.artworks DISABLE TRIGGER artworks_set_updated_at;

-- 插入35件藏品数据
INSERT INTO public.artworks (inventory_number, title, title_zh, origin, material, technique, dimensions, price, inventory_status, is_published, sort_order) VALUES
('2026050303', 'Sandstone Figures', '双人雕像', '马来西亚', 'Sandstone 砂岩', '马来西亚传统中，通常摆放在卧室里，以象征夫妻和睦、恩爱美满。', '44.5×24×27 cm / 50×27×27 cm', '￥20,000', 'available', true, 1),
('2026050304', 'Hand-Carved Wooden Duck Sculptures', '手工雕刻木鸭雕像', '印度尼西亚', 'Wood，paint 木，颜料', '袁老师在印度尼西亚从当地居住的欧洲艺术家手中购得（现代工艺品）', '60.6×21×31 cm / 61×21 30cm', '￥4,500', 'available', true, 2),
('2026050401', 'Buddha Head', '佛头', '印度尼西亚', 'Wood 木', '背后可挂墙，需要很厚实的墙体承载，有近70-80斤', '110×75×30cm', '￥20,000', 'available', true, 3),
('2026050301', 'Puppet (Yoke Thay)', '提线木偶', '缅甸', 'Wood, gold thread, fabric, embroidery 木，金丝，布料，刺绣', NULL, '72×46×19 cm', '￥15,000', 'available', true, 4),
('2026050302', 'Perahera Bronze Elephant', '骑象巡游摆件', '斯里兰卡', 'Copper Alloy 铜合金', '手工使用多种工艺制作', '45×45×20.5 cm', '￥45,000', 'available', true, 5),
('2026050311', 'Guardian Figure', '守护神', '印度尼西亚', 'Wood 木', NULL, '116/12/10cm 110/12/10cm 110/12/10cm', '￥3,500', 'available', true, 6),
('2026050305', 'Enthroned Buddha', '佛坐像', '缅甸', 'Wood 木', '缅甸的佛塔部分，家族传承/地震后获得', '—', '￥500,000', 'available', true, 7),
('2026050308', 'Art Installation', '艺术装置', '印度尼西亚', 'Iron 铁', '袁老师在印度尼西亚从当地居住的欧洲艺术家手中购得（现代工艺品）', '—', '￥180,000', 'available', true, 8),
('2026050309', 'Modern Wood Artworks', '现代木雕艺术品', '印度尼西亚', 'Wood 木', '袁老师在印度尼西亚从当地居住的欧洲艺术家手中购得，斑马纹但是长颈鹿的脖子，这是非写实创作，是印尼非常受欢迎的出口工艺品。', '—', '￥2,500', 'available', true, 9),
('2026050413', 'Animal Sculpture', '动物塑像', '斯里兰卡', 'Brass 黄铜', '纯手工制作，采取古老的失蜡法（Lost-wax casting)。工艺起源于古印度，疑似猫造型，融合了动物和图腾的审美。', '—', '￥10,000', 'sold', true, 10),
('2026050501', 'Ancestral Figure', '祖先像/守护神', '印度尼西亚-苏门答腊', 'Wood 木', '双手交叠胸前或腹部，呈V型，在东南亚象征虔诚，守护或仪式感。耳垂大是长寿，地位高的象征。眼睛形状是非写实的。', '—', '￥2,000', 'available', true, 11),
('2026050603', 'Apsara / Devata Statue', '德瓦塔雕像', '柬埔寨', 'Sandstone 砂岩', '印度教和佛教神话中，为仙女或守护女神。手持莲花苞，站立姿态，更符合德瓦塔的神殿守护者身份。可能为神庙或石壁建筑的一部分。', '—', '￥500,000', 'available', true, 12),
('2026050606', 'Guardian Lions', '守护狮（一对）', '马来西亚', 'Wood 木', '很少见，相比其他砂岩雕像', '—', '￥50,000', 'available', true, 13),
('2026050607', 'Statue of Ganesha', '象神雕像（印度教神祇）', '印度尼西亚', 'Volcanic Rock 火山岩', '象头人身：象征大智慧。站姿相比于常见的坐姿，在东南亚石雕艺术中具有很高的艺术地位。在东南亚文化中，他不仅是智慧之神和破除障碍之神，还被视为商贸、艺术和成功的守护者。', '—', '￥25,000', 'available', true, 14),
('2026050609', 'Kinnara Statue', '紧那罗塑像', '泰国', 'Wood 木', '东南亚神话生物，在佛教和印度教神话中，被认为是天界的乐师和歌手，象征着美妙的音乐、诗歌和永恒的爱情。', '—', '￥3,000', 'available', true, 15),
('2026050610', 'Gandhara Enthroned Buddha', '佛坐像', '柬埔寨', 'Schist 片岩', '犍陀罗（Gandhara）艺术风格，最显著的特征是希腊化佛教艺术的融合，带有古希腊、罗马雕塑的神韵。头顶有肉髻，发丝呈现出波浪状的卷发。', '—', '￥50,000', 'available', true, 16),
('2026050611', 'Torso of Vishnu', '毗湿奴躯干像', '柬埔寨', 'Sandstone 砂岩', '这类造像通常是大型组雕（如佛寺、神庙中的守护者、僧侣或神祇）的一部分。', '—', '￥150,000', 'available', true, 17),
('2026050805', 'Buddha Head', '佛头', '马来西亚', '花岗岩', '东南亚早期佛教艺术和印度艺术的影子，古代东南亚工匠雕刻佛像时往往融入当地人的面部特征。保留了印度原始佛教的庄严，有犍陀罗艺术的立体感。', '—', '￥70,000', 'available', true, 18),
('2026050901', 'Vassel Celadon Vase', '瓷花瓶（一大一小）', '日本', 'Goryeo celadon 高丽瓷', '日本当代因为战争和贸易原因，从韩国带了许多工匠和技术回日本，因此馆内这种器皿都是日本制造，韩国工艺。', '—', '￥1,900', 'available', true, 19),
('2026050916', 'Enthroned Buddha', '佛坐像', '马来西亚', 'Sandstone 砂岩', '看起来腐蚀痕迹明显的都是长期放在户外的。', '—', '￥20,000', 'available', true, 20),
('2026052706', 'Buddha Head', '佛头', '柬埔寨', 'Sandstone 砂岩', '当地村落人家里收的（不能确定）', '—', '￥30,000', 'available', true, 21),
('2026052709', 'Buddhapada', '佛足', '柬埔寨', 'Sandstone 砂岩', '不同地区的砂岩材质不同，杂质不同，也有可能放在泥土里久了侵蚀了。', '—', '￥20,000', 'available', true, 22),
('2026052710', 'Buddha Head', '佛头', '缅甸', '夹苎工艺（麻和大漆）', '可以保存很久很久，很轻', '—', '￥15,000', 'available', true, 23),
('2026052717', 'Ancestral Figure', '祖先像', '非洲-马里', 'Wood 木', '放在室内供奉，很少见，大都会博物馆有同类藏品。', '—', '￥55,000', 'available', true, 24),
('2026050307', 'Buddha Head', '佛头', '印度尼西亚', '雨豆木', NULL, '—', '￥10,000', 'available', true, 25),
('2026050412', 'Buddha Head', '佛头', '马来西亚', 'Bronze 青铜', NULL, '—', '￥300,000', 'available', true, 26),
('2026050414', 'Sandstone Statue', '砂岩双人雕像', '印度尼西亚-爪哇', 'Sandstone 砂岩', '传统中，通常摆放在卧室里，以象征夫妻和睦、恩爱美满。', '—', '待询价', 'available', true, 27),
('2026050415', 'Ganesha Statue', '象神雕像', '柬埔寨', 'Volcanic Rock 火山岩', NULL, '—', '￥130,000', 'available', true, 28),
('2026050502', 'Ancestral Figure', '祖先像/守护神', '印度尼西亚', 'Wood 木', NULL, '—', '￥50,000', 'available', true, 29),
('2026050506', 'Hornbill Bird Installation', '犀鸟飞鸟装置（一对）', '马来西亚', 'Wood 木', NULL, '—', '￥30,000', 'available', true, 30),
('2026050507', 'Tiger Head Painted Chair', '虎头彩绘椅（一对）', '印度', '彩绘，木', NULL, '—', '￥15,000', 'available', true, 31),
('2026050601', 'Bronze Bell', '青铜钟', '缅甸', 'Bronze 青铜', '寺庙门口的钟', '—', '￥100,000', 'available', true, 32),
('2026050602', 'Vishnu Statue', '毗湿奴雕像', '柬埔寨', 'Sandstone 砂岩', '柬埔寨吴哥时期风格。毗湿奴的特征是四只手臂，虽然下方两手残缺，但上方分别持有其典型法器，右（海螺），左（神轮）。', '—', '待询价', 'available', true, 33),
('2026050604', 'Enthroned Buddha', '佛坐像', '马来西亚', 'Sandstone 砂岩', NULL, '—', '￥50,000', 'available', true, 34),
('2026050612', 'Torso of Vishnu', '毗湿奴躯干像', '柬埔寨', 'Sandstone 砂岩', NULL, '—', '￥150,000', 'available', true, 35)
ON CONFLICT (inventory_number) DO UPDATE SET
  title = EXCLUDED.title,
  title_zh = EXCLUDED.title_zh,
  origin = EXCLUDED.origin,
  material = EXCLUDED.material,
  technique = EXCLUDED.technique,
  dimensions = EXCLUDED.dimensions,
  price = EXCLUDED.price,
  inventory_status = EXCLUDED.inventory_status,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order;

-- 重新启用触发器
ALTER TABLE public.artworks ENABLE TRIGGER artworks_set_updated_at;

-- 验证插入结果
SELECT COUNT(*) as total_count FROM public.artworks;
SELECT inventory_status, COUNT(*) FROM public.artworks GROUP BY inventory_status;