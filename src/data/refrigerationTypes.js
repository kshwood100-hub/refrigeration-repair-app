// 냉동기 분류 체계 — 현장 기준

export const KNOWHOW_CATEGORIES = [
  '압축기', '냉매계통', '전기/제어', '팬/모터', '착상/제상',
  '결로/배수', '소음/진동', '냉각불량', '오일계통', '기타',
]

export const COMPRESSOR_TYPES = [
  '왕복동식', '스크롤식', '로터리식', '스크류식', '터보(원심)식', '리니어식',
]

export const COMPRESSOR_STRUCTURES = [
  '밀폐형', '반밀폐형', '개방형',
]

export const COOLING_METHODS = [
  '공랭식', '수랭식', '증발식(쿨링타워)',
]

export const TEMP_RANGES = [
  '고온용 (+5~+15°C)',
  '중온용 (0~+5°C)',
  '저온용 (-5~-25°C)',
  '초저온용 (-25~-60°C)',
]

export const REFRIGERANT_TYPES = [
  'R-22', 'R-32', 'R-134a', 'R-404A', 'R-407C', 'R-410A',
  'R-448A', 'R-449A', 'R-452A', 'R-507A',
  'R-717 (암모니아)', 'R-744 (CO₂)', 'R-290 (프로판)', 'R-600a (이소부탄)',
  '기타',
]

export const SYSTEM_TYPES = [
  {
    group: '일반 냉동기',
    items: [
      '냉장 쇼케이스', '냉동 쇼케이스', '업소용 냉장고', '업소용 냉동고',
      '냉장창고', '냉동창고', '저온창고', '워크인 냉장', '워크인 냉동',
    ],
  },
  {
    group: '산업용 냉동기',
    items: [
      '칠러 (공랭식)', '칠러 (수랭식)', '브라인 냉동기', '글리콜 냉동기',
      '제빙기', '급속냉동기', '터널 프리져', '큐어링 냉장고',
      '중앙집중식 랙 시스템', '콘덴싱 유니트',
    ],
  },
  {
    group: '특수 냉동기',
    items: [
      '이원 냉동기', '이단 압축기', '챔버냉동기', '캡쿨러',
      '초저온 냉동기 (-40°C이하)', '암모니아 냉동기', 'CO₂ 냉동기',
      '흡수식 냉동기', '응용/주문제작',
    ],
  },
  {
    group: '공조/기타',
    items: [
      '에어컨 (패키지)', '에어컨 (스플릿)', '항온항습기',
      '냉동 제습기', '항공/특수 냉각', '기타',
    ],
  },
]

export const EXPANSION_TYPES = [
  '모세관', '온도식 팽창밸브 (TXV)', '전자식 팽창밸브 (EEV)', '플로트식', '기타',
]

// 냉동 기초 지식 콘텐츠
export const REFRIGERATION_BASICS = [
  {
    id: 'what_is',
    title: '냉동기란?',
    title_en: 'What is a Refrigeration System?',
    title_zh: '什么是制冷系统?',
    title_ja: '冷凍機とは?',
    title_es: '¿Qué es un sistema de refrigeración?',
    title_hi: 'रेफ्रिजरेशन सिस्टम क्या है?',
    title_vi: 'Hệ thống lạnh là gì?',
    title_th: 'ระบบทำความเย็นคืออะไร?',
    title_id: 'Apa itu sistem refrigerasi?',
    title_ar: 'ما هو نظام التبريد؟',
    icon: '❄️',
    content: `냉동기는 열을 빼앗아서 차갑게 만드는 장치입니다.

정확히 말하면 "냉동"이란 열을 없애는 게 아니라, 한쪽에서 다른 쪽으로 열을 이동시키는 것입니다.

예를 들어 냉장고 안이 차가워지는 이유는 냉장고 안의 열을 뒤쪽 방열판으로 옮기기 때문입니다.

현장에서 만나는 냉동기 종류:
• 냉장/냉동 쇼케이스
• 업소용 냉장고/냉동고
• 냉장창고/냉동창고
• 워크인 냉장/냉동
• 제빙기
• 칠러 (냉수 생산)
• 에어컨 (냉방도 냉동 원리)
• 급속냉동기`,
    content_en: `A refrigeration system is a device that removes heat to create a cold environment.

To be precise, "refrigeration" does not eliminate heat — it transfers heat from one place to another.

For example, the inside of a refrigerator stays cold because heat from inside is moved to the condenser coils at the back.

Types of refrigeration systems found in the field:
• Refrigerated/frozen display cases
• Commercial refrigerators/freezers
• Cold storage warehouses / frozen storage warehouses
• Walk-in coolers/freezers
• Ice makers
• Chillers (chilled water production)
• Air conditioners (also use refrigeration principles)
• Blast freezers`,
    content_zh: `制冷系统是通过移除热量来制造低温环境的装置。

准确地说,"制冷"并不是消除热量,而是将热量从一处转移到另一处。

例如,冰箱内部之所以变冷,是因为冰箱内部的热量被转移到了背面的散热盘管。

现场常见的制冷系统类型:
• 冷藏/冷冻展示柜
• 商用冷藏柜/冷冻柜
• 冷藏仓库/冷冻仓库
• 步入式冷藏/冷冻库
• 制冰机
• 冷水机组(冷水生产)
• 空调(也使用制冷原理)
• 速冻机`,
    content_ja: `冷凍機は熱を奪って冷たくする装置です。

正確に言えば「冷凍」とは熱をなくすことではなく、一方から他方へ熱を移動させることです。

例えば冷蔵庫の中が冷たくなるのは、庫内の熱を背面の放熱板に移しているからです。

現場で出会う冷凍機の種類:
• 冷蔵/冷凍ショーケース
• 業務用冷蔵庫/冷凍庫
• 冷蔵倉庫/冷凍倉庫
• ウォークイン冷蔵/冷凍
• 製氷機
• チラー (冷水生産)
• エアコン (冷房も冷凍原理)
• 急速冷凍機`,
    content_es: `Un sistema de refrigeración es un dispositivo que extrae calor para crear un ambiente frío.

Para ser precisos, la "refrigeración" no elimina el calor, sino que lo transfiere de un lugar a otro.

Por ejemplo, el interior de un refrigerador se mantiene frío porque el calor del interior se traslada a los serpentines del condensador en la parte trasera.

Tipos de sistemas de refrigeración en campo:
• Vitrinas refrigeradas/congeladas
• Refrigeradores/congeladores comerciales
• Almacenes refrigerados / cámaras de congelación
• Cámaras walk-in de refrigeración/congelación
• Máquinas de hielo
• Chillers (producción de agua fría)
• Aires acondicionados (también usan principios de refrigeración)
• Congeladores rápidos (blast freezers)`,
    content_hi: `रेफ्रिजरेशन सिस्टम एक ऐसा उपकरण है जो ठंडा वातावरण बनाने के लिए गर्मी हटाता है।

सटीक रूप से कहें तो "रेफ्रिजरेशन" गर्मी को समाप्त नहीं करता — यह गर्मी को एक जगह से दूसरी जगह स्थानांतरित करता है।

उदाहरण के लिए, रेफ्रिजरेटर का अंदर ठंडा रहता है क्योंकि अंदर की गर्मी पीछे के कंडेंसर कॉइल्स तक ले जाई जाती है।

फील्ड में मिलने वाले रेफ्रिजरेशन सिस्टम के प्रकार:
• रेफ्रिजरेटेड/फ्रोजन डिस्प्ले केस
• कमर्शियल रेफ्रिजरेटर/फ्रीजर
• कोल्ड स्टोरेज वेयरहाउस / फ्रोजन स्टोरेज वेयरहाउस
• Walk-in कूलर/फ्रीजर
• आइस मेकर
• Chiller (ठंडे पानी का उत्पादन)
• एयर कंडीशनर (रेफ्रिजरेशन सिद्धांतों का उपयोग)
• Blast freezer`,
    content_vi: `Hệ thống lạnh là thiết bị lấy nhiệt đi để tạo môi trường lạnh.

Chính xác hơn, "làm lạnh" không phải là loại bỏ nhiệt mà là chuyển nhiệt từ nơi này sang nơi khác.

Ví dụ, bên trong tủ lạnh mát vì nhiệt bên trong được chuyển sang dàn ngưng phía sau.

Các loại hệ thống lạnh thường gặp tại hiện trường:
• Tủ trưng bày lạnh/đông
• Tủ lạnh/tủ đông thương mại
• Kho lạnh / kho đông
• Phòng lạnh/đông walk-in
• Máy đá
• Chiller (sản xuất nước lạnh)
• Điều hòa (cũng dùng nguyên lý làm lạnh)
• Máy cấp đông nhanh`,
    content_th: `ระบบทำความเย็นคืออุปกรณ์ที่ดึงความร้อนออกเพื่อสร้างสภาพแวดล้อมเย็น

พูดให้ถูกต้องคือ "การทำความเย็น" ไม่ใช่การกำจัดความร้อน แต่เป็นการย้ายความร้อนจากที่หนึ่งไปอีกที่หนึ่ง

ตัวอย่างเช่น ภายในตู้เย็นเย็นได้เพราะความร้อนภายในถูกย้ายไปยังคอยล์คอนเดนเซอร์ด้านหลัง

ประเภทระบบทำความเย็นที่พบในงานสนาม:
• ตู้โชว์แช่เย็น/แช่แข็ง
• ตู้เย็น/ตู้แช่แข็งเชิงพาณิชย์
• คลังเก็บความเย็น / คลังเก็บแช่แข็ง
• ห้องเย็น/ห้องแช่แข็งแบบเดินเข้า
• เครื่องทำน้ำแข็ง
• ชิลเลอร์ (ผลิตน้ำเย็น)
• เครื่องปรับอากาศ (ใช้หลักการทำความเย็น)
• เครื่องแช่แข็งเร็ว`,
    content_id: `Sistem refrigerasi adalah perangkat yang menghilangkan panas untuk menciptakan lingkungan dingin.

Tepatnya, "refrigerasi" tidak menghilangkan panas — melainkan memindahkan panas dari satu tempat ke tempat lain.

Sebagai contoh, bagian dalam kulkas tetap dingin karena panas dari dalam dipindahkan ke koil kondensor di belakang.

Jenis sistem refrigerasi yang ditemui di lapangan:
• Showcase pendingin/pembeku
• Kulkas/freezer komersial
• Cold storage / cold storage beku
• Walk-in cooler/freezer
• Mesin es (ice maker)
• Chiller (produksi air dingin)
• AC (juga menggunakan prinsip refrigerasi)
• Blast freezer (pembeku cepat)`,
    content_ar: `نظام التبريد هو جهاز يقوم بنزع الحرارة لتكوين بيئة باردة.

بدقة، "التبريد" لا يلغي الحرارة — بل ينقلها من مكان إلى آخر.

مثلاً، داخل الثلاجة يظل بارداً لأن الحرارة من الداخل تُنقل إلى ملفات المكثف في الخلف.

أنواع أنظمة التبريد التي تُصادف في الموقع:
• خزائن العرض المبردة/المجمدة
• ثلاجات/مجمدات تجارية
• مستودعات تبريد / مستودعات تجميد
• غرف تبريد/تجميد قابلة للدخول (Walk-in)
• ماكينات الثلج
• مبردات الماء (Chiller)
• مكيفات الهواء (تستخدم مبادئ التبريد أيضاً)
• مجمدات سريعة (Blast freezer)`,
  },
  {
    id: 'basic_cycle',
    title: '기본 냉동 사이클',
    title_en: 'Basic Refrigeration Cycle',
    title_zh: '基本制冷循环',
    title_ja: '基本冷凍サイクル',
    title_es: 'Ciclo básico de refrigeración',
    title_hi: 'मूल रेफ्रिजरेशन साइकिल',
    title_vi: 'Chu trình lạnh cơ bản',
    title_th: 'วงจรทำความเย็นพื้นฐาน',
    title_id: 'Siklus refrigerasi dasar',
    title_ar: 'دورة التبريد الأساسية',
    icon: '🔄',
    content: `증기압축식 냉동기의 기본 4단계:

① 압축기 (Compressor)
  냉매 가스를 고온·고압으로 압축
  → 압축기에서 나오는 냉매는 뜨겁고 압력이 높음

② 응축기 (Condenser)
  고온·고압 냉매가 열을 바깥으로 버리면서 액체로 변함
  → 공랭식은 팬이 열을 날려보냄

③ 팽창장치 (Expansion Device)
  고압 액체 냉매의 압력을 급격히 낮춤
  → 압력이 낮아지면서 냉매 온도도 급격히 떨어짐

④ 증발기 (Evaporator)
  저온·저압 냉매가 주변 열을 빼앗으며 기체로 변함
  → 이때 물건이나 공기가 차가워짐

순환: 증발기 → 압축기 → 응축기 → 팽창장치 → 증발기 (반복)

핵심 포인트:
• 증발기 쪽 = 저압 (흡입 압력)
• 응축기 쪽 = 고압 (토출 압력)`,
    content_en: `Four basic stages of a vapor compression refrigeration system:

① Compressor
  Compresses refrigerant gas to high temperature and high pressure
  → Refrigerant leaving the compressor is hot and high-pressure

② Condenser
  High-temperature, high-pressure refrigerant releases heat to the outside and condenses into liquid
  → Air-cooled type uses a fan to dissipate heat

③ Expansion Device
  Rapidly reduces the pressure of high-pressure liquid refrigerant
  → As pressure drops, refrigerant temperature drops sharply

④ Evaporator
  Low-temperature, low-pressure refrigerant absorbs surrounding heat and vaporizes
  → This is where products or air are cooled

Cycle: Evaporator → Compressor → Condenser → Expansion Device → Evaporator (repeat)

Key points:
• Evaporator side = Low pressure (suction pressure)
• Condenser side = High pressure (discharge pressure)`,
    content_zh: `蒸气压缩式制冷系统的四个基本阶段:

① 压缩机 (Compressor)
  将制冷剂气体压缩到高温高压
  → 离开压缩机的制冷剂温度高、压力大

② 冷凝器 (Condenser)
  高温高压制冷剂将热量排放到外部并冷凝成液体
  → 风冷式由风扇驱散热量

③ 膨胀装置 (Expansion Device)
  迅速降低高压液体制冷剂的压力
  → 随着压力下降,制冷剂温度急剧下降

④ 蒸发器 (Evaporator)
  低温低压制冷剂吸收周围热量并蒸发为气体
  → 此时物品或空气被冷却

循环: 蒸发器 → 压缩机 → 冷凝器 → 膨胀装置 → 蒸发器 (重复)

关键要点:
• 蒸发器侧 = 低压 (吸气压力)
• 冷凝器侧 = 高压 (排气压力)`,
    content_ja: `蒸気圧縮式冷凍機の基本4段階:

① 圧縮機 (Compressor)
  冷媒ガスを高温・高圧に圧縮
  → 圧縮機から出る冷媒は高温・高圧

② 凝縮器 (Condenser)
  高温・高圧冷媒が外部に熱を放出して液体に変わる
  → 空冷式はファンで熱を放散

③ 膨張装置 (Expansion Device)
  高圧液冷媒の圧力を急激に下げる
  → 圧力低下で冷媒温度が急激に下がる

④ 蒸発器 (Evaporator)
  低温・低圧冷媒が周囲の熱を奪って気体に変わる
  → このとき物や空気が冷える

循環: 蒸発器 → 圧縮機 → 凝縮器 → 膨張装置 → 蒸発器 (繰り返し)

重要ポイント:
• 蒸発器側 = 低圧 (吸入圧力)
• 凝縮器側 = 高圧 (吐出圧力)`,
    content_es: `Las cuatro etapas básicas de un sistema de refrigeración por compresión de vapor:

① Compresor (Compressor)
  Comprime el gas refrigerante a alta temperatura y alta presión
  → El refrigerante que sale del compresor está caliente y a alta presión

② Condensador (Condenser)
  El refrigerante a alta temperatura y presión libera calor al exterior y se condensa en líquido
  → El tipo enfriado por aire usa un ventilador para disipar el calor

③ Dispositivo de expansión (Expansion Device)
  Reduce rápidamente la presión del refrigerante líquido de alta presión
  → Al caer la presión, la temperatura del refrigerante baja bruscamente

④ Evaporador (Evaporator)
  El refrigerante a baja temperatura y presión absorbe el calor del entorno y se evapora
  → En este punto los productos o el aire se enfrían

Ciclo: Evaporador → Compresor → Condensador → Dispositivo de expansión → Evaporador (repetir)

Puntos clave:
• Lado del evaporador = Baja presión (presión de succión)
• Lado del condensador = Alta presión (presión de descarga)`,
    content_hi: `Vapor compression रेफ्रिजरेशन सिस्टम के चार बुनियादी चरण:

① कंप्रेसर (Compressor)
  रेफ्रिजरेंट गैस को उच्च तापमान और उच्च दबाव पर संपीड़ित करता है
  → कंप्रेसर से निकलने वाला रेफ्रिजरेंट गर्म और उच्च दबाव वाला होता है

② कंडेंसर (Condenser)
  उच्च तापमान, उच्च दबाव वाला रेफ्रिजरेंट बाहर गर्मी छोड़ता है और तरल में बदल जाता है
  → Air-cooled प्रकार में पंखा गर्मी फैलाता है

③ एक्सपैंशन डिवाइस (Expansion Device)
  उच्च दबाव वाले तरल रेफ्रिजरेंट का दबाव तेजी से कम करता है
  → दबाव गिरते ही रेफ्रिजरेंट का तापमान तेजी से गिरता है

④ एवापोरेटर (Evaporator)
  निम्न तापमान, निम्न दबाव वाला रेफ्रिजरेंट आसपास की गर्मी अवशोषित करके वाष्प बन जाता है
  → इस बिंदु पर उत्पाद या हवा ठंडी होती है

चक्र: Evaporator → Compressor → Condenser → Expansion Device → Evaporator (दोहराएँ)

मुख्य बिंदु:
• Evaporator तरफ = निम्न दबाव (suction pressure)
• Condenser तरफ = उच्च दबाव (discharge pressure)`,
    content_vi: `Bốn giai đoạn cơ bản của hệ thống lạnh nén hơi:

① Máy nén (Compressor)
  Nén gas refrigerant thành nhiệt độ cao, áp cao
  → Gas ra khỏi máy nén nóng và áp suất cao

② Dàn ngưng (Condenser)
  Gas nhiệt độ cao, áp cao xả nhiệt ra ngoài và ngưng tụ thành lỏng
  → Loại giải nhiệt gió dùng quạt để tản nhiệt

③ Van tiết lưu (Expansion Device)
  Giảm áp đột ngột của lỏng cao áp
  → Khi áp giảm, nhiệt độ gas cũng giảm mạnh

④ Dàn bay hơi (Evaporator)
  Gas nhiệt độ thấp, áp thấp hấp thụ nhiệt xung quanh và bay hơi
  → Đây là lúc sản phẩm hoặc không khí được làm lạnh

Chu trình: Bay hơi → Máy nén → Ngưng tụ → Tiết lưu → Bay hơi (lặp lại)

Điểm chính:
• Phía dàn bay hơi = Áp thấp (áp hút)
• Phía dàn ngưng = Áp cao (áp đẩy)`,
    content_th: `4 ขั้นตอนพื้นฐานของระบบทำความเย็นแบบอัดไอ:

① คอมเพรสเซอร์ (Compressor)
  อัดน้ำยาให้มีอุณหภูมิสูง แรงดันสูง
  → น้ำยาที่ออกจากคอมเพรสเซอร์ร้อนและแรงดันสูง

② คอนเดนเซอร์ (Condenser)
  น้ำยาอุณหภูมิสูง แรงดันสูง ปล่อยความร้อนออกและกลายเป็นของเหลว
  → แบบระบายอากาศใช้พัดลมระบายความร้อน

③ วาล์วลดความดัน (Expansion Device)
  ลดแรงดันน้ำยาเหลวความดันสูงอย่างรวดเร็ว
  → เมื่อแรงดันลด อุณหภูมิน้ำยาก็ลดลงอย่างรวดเร็ว

④ อีวาปอเรเตอร์ (Evaporator)
  น้ำยาอุณหภูมิต่ำ แรงดันต่ำ ดูดความร้อนรอบ ๆ และระเหยเป็นไอ
  → ณ จุดนี้สินค้าหรืออากาศจะถูกทำให้เย็น

วงจร: อีวาปอเรเตอร์ → คอมเพรสเซอร์ → คอนเดนเซอร์ → วาล์วลดความดัน → อีวาปอเรเตอร์ (วน)

จุดสำคัญ:
• ด้านอีวาปอเรเตอร์ = แรงดันต่ำ (suction pressure)
• ด้านคอนเดนเซอร์ = แรงดันสูง (discharge pressure)`,
    content_id: `Empat tahap dasar sistem refrigerasi kompresi uap:

① Kompresor (Compressor)
  Memampatkan gas refrigeran ke suhu tinggi dan tekanan tinggi
  → Refrigeran yang keluar dari kompresor panas dan bertekanan tinggi

② Kondensor (Condenser)
  Refrigeran suhu/tekanan tinggi melepas panas keluar dan mengembun menjadi cairan
  → Tipe air-cooled menggunakan kipas untuk membuang panas

③ Katup Ekspansi (Expansion Device)
  Menurunkan tekanan refrigeran cair tekanan tinggi secara drastis
  → Saat tekanan turun, suhu refrigeran turun drastis

④ Evaporator (Evaporator)
  Refrigeran suhu/tekanan rendah menyerap panas sekitar dan menguap
  → Di sini produk atau udara didinginkan

Siklus: Evaporator → Kompresor → Kondensor → Katup Ekspansi → Evaporator (berulang)

Poin penting:
• Sisi evaporator = Tekanan rendah (tekanan hisap)
• Sisi kondensor = Tekanan tinggi (tekanan discharge)`,
    content_ar: `المراحل الأربع الأساسية لنظام التبريد بضغط البخار:

① الضاغط (Compressor)
  يضغط غاز الفريون إلى درجة حرارة عالية وضغط مرتفع
  → الفريون الخارج من الضاغط ساخن وعالي الضغط

② المكثف (Condenser)
  الفريون عالي الحرارة والضغط يطلق الحرارة للخارج ويتكثف إلى سائل
  → النوع المبرد بالهواء يستخدم مروحة لتبديد الحرارة

③ صمام التمدد (Expansion Device)
  يخفض ضغط الفريون السائل عالي الضغط بسرعة
  → مع انخفاض الضغط، تنخفض درجة حرارة الفريون بشدة

④ المبخر (Evaporator)
  الفريون منخفض الحرارة والضغط يمتص الحرارة من المحيط ويتبخر
  → في هذه النقطة يتم تبريد المنتجات أو الهواء

الدورة: المبخر → الضاغط → المكثف → صمام التمدد → المبخر (تتكرر)

نقاط رئيسية:
• جانب المبخر = ضغط منخفض (ضغط السحب)
• جانب المكثف = ضغط مرتفع (ضغط التصريف)`,
  },
  {
    id: 'pressure_temp',
    title: '압력과 온도의 관계 (P-T)',
    title_en: 'Pressure-Temperature Relationship (P-T)',
    title_zh: '压力与温度关系 (P-T)',
    title_ja: '圧力と温度の関係 (P-T)',
    title_es: 'Relación presión-temperatura (P-T)',
    title_hi: 'दबाव-तापमान संबंध (P-T)',
    title_vi: 'Quan hệ áp suất - nhiệt độ (P-T)',
    title_th: 'ความสัมพันธ์แรงดัน-อุณหภูมิ (P-T)',
    title_id: 'Hubungan tekanan-suhu (P-T)',
    title_ar: 'العلاقة بين الضغط ودرجة الحرارة (P-T)',
    icon: '📊',
    content: `냉동기에서 압력과 온도는 항상 함께 움직입니다.

냉매별 포화압력 (대략적 기준):

R-22:
• -15°C → 약 2.1 bar (저압)
• +45°C → 약 17.3 bar (고압)

R-404A:
• -15°C → 약 3.7 bar (저압)
• +45°C → 약 24.0 bar (고압)

R-410A:
• -15°C → 약 5.8 bar (저압)
• +45°C → 약 36.0 bar (고압)

R-134a:
• -15°C → 약 1.6 bar (저압)
• +45°C → 약 11.6 bar (고압)

실무 활용법:
게이지 압력을 보고 냉매 온도를 알 수 있음
→ 냉매 부족이면 저압이 낮아짐
→ 응축기 막히면 고압이 올라감`,
    content_en: `In refrigeration systems, pressure and temperature always move together.

Approximate saturation pressures by refrigerant:

R-22:
• -15°C → approx. 2.1 bar (low side)
• +45°C → approx. 17.3 bar (high side)

R-404A:
• -15°C → approx. 3.7 bar (low side)
• +45°C → approx. 24.0 bar (high side)

R-410A:
• -15°C → approx. 5.8 bar (low side)
• +45°C → approx. 36.0 bar (high side)

R-134a:
• -15°C → approx. 1.6 bar (low side)
• +45°C → approx. 11.6 bar (high side)

Field application:
Read gauge pressure to determine refrigerant temperature
→ Low refrigerant charge = low suction pressure
→ Blocked condenser = high discharge pressure`,
    content_zh: `在制冷系统中,压力和温度始终同步变化。

各制冷剂饱和压力 (近似值):

R-22:
• -15°C → 约 2.1 bar (低压)
• +45°C → 约 17.3 bar (高压)

R-404A:
• -15°C → 约 3.7 bar (低压)
• +45°C → 约 24.0 bar (高压)

R-410A:
• -15°C → 约 5.8 bar (低压)
• +45°C → 约 36.0 bar (高压)

R-134a:
• -15°C → 约 1.6 bar (低压)
• +45°C → 约 11.6 bar (高压)

现场应用:
通过表压可以判断制冷剂温度
→ 制冷剂不足时低压下降
→ 冷凝器堵塞时高压升高`,
    content_ja: `冷凍機において圧力と温度は常に連動して動きます。

冷媒別飽和圧力 (おおよその基準):

R-22:
• -15°C → 約 2.1 bar (低圧)
• +45°C → 約 17.3 bar (高圧)

R-404A:
• -15°C → 約 3.7 bar (低圧)
• +45°C → 約 24.0 bar (高圧)

R-410A:
• -15°C → 約 5.8 bar (低圧)
• +45°C → 約 36.0 bar (高圧)

R-134a:
• -15°C → 約 1.6 bar (低圧)
• +45°C → 約 11.6 bar (高圧)

現場での活用法:
ゲージ圧から冷媒温度が分かる
→ 冷媒不足なら低圧が下がる
→ 凝縮器が詰まれば高圧が上がる`,
    content_es: `En los sistemas de refrigeración, la presión y la temperatura siempre se mueven juntas.

Presiones de saturación aproximadas por refrigerante:

R-22:
• -15°C → aprox. 2.1 bar (lado bajo)
• +45°C → aprox. 17.3 bar (lado alto)

R-404A:
• -15°C → aprox. 3.7 bar (lado bajo)
• +45°C → aprox. 24.0 bar (lado alto)

R-410A:
• -15°C → aprox. 5.8 bar (lado bajo)
• +45°C → aprox. 36.0 bar (lado alto)

R-134a:
• -15°C → aprox. 1.6 bar (lado bajo)
• +45°C → aprox. 11.6 bar (lado alto)

Aplicación práctica:
Leer la presión del manómetro permite saber la temperatura del refrigerante
→ Carga baja de refrigerante = baja presión de succión
→ Condensador obstruido = alta presión de descarga`,
    content_hi: `रेफ्रिजरेशन सिस्टम में दबाव और तापमान हमेशा एक साथ चलते हैं।

रेफ्रिजरेंट के अनुसार saturation दबाव (अनुमानित):

R-22:
• -15°C → लगभग 2.1 bar (low side)
• +45°C → लगभग 17.3 bar (high side)

R-404A:
• -15°C → लगभग 3.7 bar (low side)
• +45°C → लगभग 24.0 bar (high side)

R-410A:
• -15°C → लगभग 5.8 bar (low side)
• +45°C → लगभग 36.0 bar (high side)

R-134a:
• -15°C → लगभग 1.6 bar (low side)
• +45°C → लगभग 11.6 bar (high side)

व्यावहारिक उपयोग:
Gauge pressure से रेफ्रिजरेंट तापमान का पता चलता है
→ रेफ्रिजरेंट कम = suction pressure कम
→ Condenser ब्लॉक = discharge pressure ज़्यादा`,
    content_vi: `Trong hệ thống lạnh, áp suất và nhiệt độ luôn thay đổi cùng nhau.

Áp suất bão hòa theo từng loại gas (giá trị xấp xỉ):

R-22:
• -15°C → khoảng 2.1 bar (áp thấp)
• +45°C → khoảng 17.3 bar (áp cao)

R-404A:
• -15°C → khoảng 3.7 bar (áp thấp)
• +45°C → khoảng 24.0 bar (áp cao)

R-410A:
• -15°C → khoảng 5.8 bar (áp thấp)
• +45°C → khoảng 36.0 bar (áp cao)

R-134a:
• -15°C → khoảng 1.6 bar (áp thấp)
• +45°C → khoảng 11.6 bar (áp cao)

Ứng dụng thực tế:
Đọc áp suất đồng hồ để biết nhiệt độ gas
→ Thiếu gas: áp thấp xuống thấp
→ Tắc dàn ngưng: áp cao lên cao`,
    content_th: `ในระบบทำความเย็น แรงดันและอุณหภูมิเคลื่อนไหวพร้อมกันเสมอ

แรงดันอิ่มตัวตามชนิดน้ำยา (ค่าโดยประมาณ):

R-22:
• -15°C → ประมาณ 2.1 bar (ด้านต่ำ)
• +45°C → ประมาณ 17.3 bar (ด้านสูง)

R-404A:
• -15°C → ประมาณ 3.7 bar (ด้านต่ำ)
• +45°C → ประมาณ 24.0 bar (ด้านสูง)

R-410A:
• -15°C → ประมาณ 5.8 bar (ด้านต่ำ)
• +45°C → ประมาณ 36.0 bar (ด้านสูง)

R-134a:
• -15°C → ประมาณ 1.6 bar (ด้านต่ำ)
• +45°C → ประมาณ 11.6 bar (ด้านสูง)

การใช้งานในงานสนาม:
อ่านแรงดันเกจเพื่อรู้อุณหภูมิน้ำยา
→ น้ำยาน้อย = แรงดันด้านดูดต่ำ
→ คอนเดนเซอร์อุดตัน = แรงดันด้านส่งสูง`,
    content_id: `Pada sistem refrigerasi, tekanan dan suhu selalu bergerak bersama.

Tekanan jenuh per refrigeran (perkiraan):

R-22:
• -15°C → sekitar 2.1 bar (sisi rendah)
• +45°C → sekitar 17.3 bar (sisi tinggi)

R-404A:
• -15°C → sekitar 3.7 bar (sisi rendah)
• +45°C → sekitar 24.0 bar (sisi tinggi)

R-410A:
• -15°C → sekitar 5.8 bar (sisi rendah)
• +45°C → sekitar 36.0 bar (sisi tinggi)

R-134a:
• -15°C → sekitar 1.6 bar (sisi rendah)
• +45°C → sekitar 11.6 bar (sisi tinggi)

Aplikasi lapangan:
Baca tekanan gauge untuk mengetahui suhu refrigeran
→ Refrigeran kurang = tekanan hisap turun
→ Kondensor tersumbat = tekanan discharge naik`,
    content_ar: `في أنظمة التبريد، يتحرك الضغط ودرجة الحرارة معاً دائماً.

ضغط التشبع حسب نوع الفريون (تقريبي):

R-22:
• -15°م → نحو 2.1 بار (الجانب المنخفض)
• +45°م → نحو 17.3 بار (الجانب المرتفع)

R-404A:
• -15°م → نحو 3.7 بار (الجانب المنخفض)
• +45°م → نحو 24.0 بار (الجانب المرتفع)

R-410A:
• -15°م → نحو 5.8 بار (الجانب المنخفض)
• +45°م → نحو 36.0 بار (الجانب المرتفع)

R-134a:
• -15°م → نحو 1.6 بار (الجانب المنخفض)
• +45°م → نحو 11.6 بار (الجانب المرتفع)

التطبيق الميداني:
اقرأ ضغط المؤشر لمعرفة درجة حرارة الفريون
→ نقص الفريون = انخفاض ضغط السحب
→ انسداد المكثف = ارتفاع ضغط التصريف`,
  },
  {
    id: 'superheat_subcool',
    title: '과열도와 과냉도',
    title_en: 'Superheat and Subcooling',
    title_zh: '过热度与过冷度',
    title_ja: '過熱度と過冷却度',
    title_es: 'Sobrecalentamiento y subenfriamiento',
    title_hi: 'Superheat और Subcooling',
    title_vi: 'Độ quá nhiệt và độ quá lạnh',
    title_th: 'ซูเปอร์ฮีตและซับคูล',
    title_id: 'Superheat dan Subcooling',
    title_ar: 'درجة الإحماء والتبريد الفائق',
    icon: '🎯',
    content: `냉동기 상태를 진단하는 핵심 수치입니다.

▶ 과열도 (Superheat)
증발기를 나온 냉매가 포화온도보다 얼마나 더 뜨거운지

계산: 흡입관 온도 - 저압 포화온도
정상값: 5~10°C (TXV 기준)

• 과열도 높음 → 냉매 부족 또는 TXV 개도 부족
• 과열도 낮음 → 냉매 과충전 또는 TXV 과다 개방

▶ 과냉도 (Subcooling)
응축기를 나온 액냉매가 포화온도보다 얼마나 더 차가운지

계산: 고압 포화온도 - 액관 온도
정상값: 5~8°C

• 과냉도 낮음 → 냉매 부족 또는 응축기 불량
• 과냉도 높음 → 냉매 과충전

현장 팁:
과열도/과냉도가 정상이면 냉매량은 OK
이 수치 이상하면 냉매 먼저 의심`,
    content_en: `These are the key diagnostic values for assessing refrigeration system condition.

▶ Superheat
How much warmer the refrigerant leaving the evaporator is compared to its saturation temperature

Calculation: Suction line temperature - Suction saturation temperature
Normal range: 5~10°C (for TXV systems)

• High superheat → Low refrigerant charge or TXV underfeeding
• Low superheat → Refrigerant overcharge or TXV overfeeding

▶ Subcooling
How much cooler the liquid refrigerant leaving the condenser is compared to its saturation temperature

Calculation: Condensing saturation temperature - Liquid line temperature
Normal range: 5~8°C

• Low subcooling → Low refrigerant charge or condenser malfunction
• High subcooling → Refrigerant overcharge

Field tip:
If superheat/subcooling are in normal range, refrigerant charge is OK
If these values are off, suspect refrigerant first`,
    content_zh: `这是诊断制冷系统状态的核心数值。

▶ 过热度 (Superheat)
离开蒸发器的制冷剂比饱和温度高多少

计算: 吸气管温度 - 低压饱和温度
正常值: 5~10°C (TXV 系统)

• 过热度高 → 制冷剂不足 或 TXV 供液不足
• 过热度低 → 制冷剂过充 或 TXV 供液过多

▶ 过冷度 (Subcooling)
离开冷凝器的液态制冷剂比饱和温度低多少

计算: 高压饱和温度 - 液管温度
正常值: 5~8°C

• 过冷度低 → 制冷剂不足 或 冷凝器异常
• 过冷度高 → 制冷剂过充

现场提示:
过热度/过冷度正常 = 制冷剂量 OK
数值异常时优先怀疑制冷剂`,
    content_ja: `冷凍機の状態を診断する重要な数値です。

▶ 過熱度 (Superheat)
蒸発器を出た冷媒が飽和温度よりどれだけ高いか

計算: 吸入管温度 - 低圧飽和温度
正常値: 5~10°C (TXV基準)

• 過熱度高い → 冷媒不足 または TXV開度不足
• 過熱度低い → 冷媒過充填 または TXV開きすぎ

▶ 過冷却度 (Subcooling)
凝縮器を出た液冷媒が飽和温度よりどれだけ低いか

計算: 高圧飽和温度 - 液管温度
正常値: 5~8°C

• 過冷却度低い → 冷媒不足 または 凝縮器不良
• 過冷却度高い → 冷媒過充填

現場のコツ:
過熱度/過冷却度が正常なら冷媒量はOK
これらが異常なら冷媒をまず疑う`,
    content_es: `Estos son los valores diagnósticos clave para evaluar el estado del sistema de refrigeración.

▶ Sobrecalentamiento (Superheat)
Cuánto más caliente está el refrigerante que sale del evaporador respecto a su temperatura de saturación

Cálculo: Temperatura línea de succión - Temperatura saturación succión
Rango normal: 5~10°C (sistemas TXV)

• Sobrecalentamiento alto → Carga baja de refrigerante o TXV insuficiente
• Sobrecalentamiento bajo → Sobrecarga de refrigerante o TXV demasiado abierto

▶ Subenfriamiento (Subcooling)
Cuánto más frío está el refrigerante líquido que sale del condensador respecto a su temperatura de saturación

Cálculo: Temperatura saturación condensación - Temperatura línea líquida
Rango normal: 5~8°C

• Subenfriamiento bajo → Carga baja de refrigerante o condensador defectuoso
• Subenfriamiento alto → Sobrecarga de refrigerante

Consejo de campo:
Si superheat/subcooling están en rango normal, la carga de refrigerante está OK
Si estos valores están fuera, sospechar primero del refrigerante`,
    content_hi: `ये रेफ्रिजरेशन सिस्टम की स्थिति का आकलन करने वाले मुख्य diagnostic मान हैं।

▶ Superheat
Evaporator से निकलने वाला रेफ्रिजरेंट अपने saturation तापमान से कितना गर्म है

गणना: Suction line temperature - Suction saturation temperature
सामान्य रेंज: 5~10°C (TXV सिस्टम)

• High superheat → रेफ्रिजरेंट कम या TXV underfeeding
• Low superheat → रेफ्रिजरेंट overcharge या TXV overfeeding

▶ Subcooling
Condenser से निकलने वाला तरल रेफ्रिजरेंट अपने saturation तापमान से कितना ठंडा है

गणना: Condensing saturation temperature - Liquid line temperature
सामान्य रेंज: 5~8°C

• Low subcooling → रेफ्रिजरेंट कम या condenser खराब
• High subcooling → रेफ्रिजरेंट overcharge

फील्ड टिप:
Superheat/subcooling सामान्य रेंज में = रेफ्रिजरेंट चार्ज OK
ये मान असामान्य = पहले रेफ्रिजरेंट का शक करें`,
    content_vi: `Đây là các giá trị chẩn đoán cốt lõi để đánh giá tình trạng hệ thống lạnh.

▶ Độ quá nhiệt (Superheat)
Gas ra khỏi dàn bay hơi nóng hơn nhiệt độ bão hòa bao nhiêu

Tính: Nhiệt độ ống hút - Nhiệt độ bão hòa áp thấp
Giá trị bình thường: 5~10°C (hệ TXV)

• Quá nhiệt cao → Thiếu gas hoặc TXV cấp thiếu
• Quá nhiệt thấp → Nạp dư gas hoặc TXV mở quá

▶ Độ quá lạnh (Subcooling)
Lỏng ra khỏi dàn ngưng lạnh hơn nhiệt độ bão hòa bao nhiêu

Tính: Nhiệt độ bão hòa ngưng tụ - Nhiệt độ ống lỏng
Giá trị bình thường: 5~8°C

• Quá lạnh thấp → Thiếu gas hoặc dàn ngưng hỏng
• Quá lạnh cao → Nạp dư gas

Mẹo hiện trường:
Quá nhiệt/quá lạnh trong khoảng bình thường = lượng gas OK
Giá trị bất thường thì nghi ngờ gas trước`,
    content_th: `เป็นค่าหลักในการวินิจฉัยสภาพระบบทำความเย็น

▶ ซูเปอร์ฮีต (Superheat)
น้ำยาที่ออกจากอีวาปอเรเตอร์ร้อนกว่าอุณหภูมิอิ่มตัวเท่าไร

คำนวณ: อุณหภูมิท่อดูด - อุณหภูมิอิ่มตัวด้านต่ำ
ค่าปกติ: 5~10°C (ระบบ TXV)

• ซูเปอร์ฮีตสูง → น้ำยาน้อย หรือ TXV จ่ายน้อย
• ซูเปอร์ฮีตต่ำ → น้ำยาเกิน หรือ TXV เปิดเกิน

▶ ซับคูล (Subcooling)
น้ำยาเหลวที่ออกจากคอนเดนเซอร์เย็นกว่าอุณหภูมิอิ่มตัวเท่าไร

คำนวณ: อุณหภูมิอิ่มตัวคอนเดนเซอร์ - อุณหภูมิท่อของเหลว
ค่าปกติ: 5~8°C

• ซับคูลต่ำ → น้ำยาน้อย หรือ คอนเดนเซอร์เสีย
• ซับคูลสูง → น้ำยาเกิน

เคล็ดลับงานสนาม:
ซูเปอร์ฮีต/ซับคูลปกติ = ปริมาณน้ำยา OK
ค่าผิดปกติ = สงสัยน้ำยาก่อน`,
    content_id: `Ini adalah nilai diagnostik utama untuk menilai kondisi sistem refrigerasi.

▶ Superheat
Seberapa lebih panas refrigeran keluar evaporator dibanding suhu jenuh

Perhitungan: Suhu pipa hisap - Suhu jenuh hisap
Rentang normal: 5~10°C (untuk sistem TXV)

• Superheat tinggi → Refrigeran kurang atau TXV underfeeding
• Superheat rendah → Pengisian berlebih atau TXV overfeeding

▶ Subcooling
Seberapa lebih dingin refrigeran cair keluar kondensor dibanding suhu jenuh

Perhitungan: Suhu jenuh kondensasi - Suhu pipa cair
Rentang normal: 5~8°C

• Subcooling rendah → Refrigeran kurang atau kondensor rusak
• Subcooling tinggi → Pengisian berlebih

Tip lapangan:
Jika superheat/subcooling normal, jumlah refrigeran OK
Jika nilai abnormal, curigai refrigeran lebih dulu`,
    content_ar: `هذه قيم تشخيصية أساسية لتقييم حالة نظام التبريد.

▶ درجة الإحماء (Superheat)
كم ترتفع حرارة الفريون الخارج من المبخر فوق حرارة التشبع

الحساب: حرارة أنبوب السحب - حرارة تشبع الجانب المنخفض
المدى الطبيعي: 5~10°م (لأنظمة TXV)

• إحماء مرتفع → نقص الفريون أو قصور TXV في التغذية
• إحماء منخفض → شحن زائد أو TXV مفتوح زيادة

▶ التبريد الفائق (Subcooling)
كم تنخفض حرارة الفريون السائل الخارج من المكثف تحت حرارة التشبع

الحساب: حرارة تشبع التكثيف - حرارة أنبوب السائل
المدى الطبيعي: 5~8°م

• تبريد فائق منخفض → نقص الفريون أو عطل المكثف
• تبريد فائق مرتفع → شحن زائد

نصيحة ميدانية:
إذا كان الإحماء/التبريد الفائق ضمن المدى الطبيعي، فالشحنة جيدة
إذا كانت القيم خارج المدى، اشتبه بالفريون أولاً`,
  },
  {
    id: 'compressor_types',
    title: '압축기 종류와 특징',
    title_en: 'Compressor Types and Characteristics',
    title_zh: '压缩机种类与特点',
    title_ja: '圧縮機の種類と特徴',
    title_es: 'Tipos y características de compresores',
    title_hi: 'कंप्रेसर के प्रकार और विशेषताएँ',
    title_vi: 'Các loại máy nén và đặc điểm',
    title_th: 'ประเภทและคุณสมบัติของคอมเพรสเซอร์',
    title_id: 'Jenis dan karakteristik kompresor',
    title_ar: 'أنواع الضواغط وخصائصها',
    icon: '⚙️',
    content: `▶ 왕복동식 (Reciprocating)
  피스톤이 왕복하며 압축
  • 장점: 정비성 좋음, 저온(-40°C 이하)에 강함
  • 단점: 진동/소음 큼, 오일 관리 중요
  • 주 용도: 냉동창고, 저온장비

▶ 스크롤식 (Scroll)
  나선형 2개가 맞물려 압축
  • 장점: 조용함, 효율 좋음, 가장 보편적
  • 단점: 역회전 금지, 분해 불가
  • 주 용도: 쇼케이스, 패키지 에어컨

▶ 로터리식 (Rotary)
  로터가 회전하며 압축
  • 장점: 소형·경량, 저렴
  • 단점: 고압에 약함
  • 주 용도: 소형 냉장고, 에어컨

▶ 스크류식 (Screw)
  두 개의 나사 로터로 압축
  • 장점: 대용량 연속운전에 강함
  • 단점: 고가, 오일 관리 중요
  • 주 용도: 중대형 산업용 냉동기

▶ 구조별 분류:
• 밀폐형 — 모터+압축기 일체, 통째 교체
• 반밀폐형 — 볼트 분해 가능, 정비 가능
• 개방형 — 모터 분리, 주로 암모니아용`,
    content_en: `▶ Reciprocating
  Piston moves back and forth to compress refrigerant
  • Pros: Good serviceability, handles low temperatures (-40°C and below)
  • Cons: High vibration/noise, oil management critical
  • Common use: Frozen storage, low-temperature equipment

▶ Scroll
  Two interlocking spiral scrolls compress refrigerant
  • Pros: Quiet, efficient, most widely used
  • Cons: No reverse rotation allowed, not field-serviceable
  • Common use: Display cases, packaged air conditioners

▶ Rotary
  Rotating rotor compresses refrigerant
  • Pros: Compact, lightweight, inexpensive
  • Cons: Weak at high pressures
  • Common use: Small refrigerators, air conditioners

▶ Screw
  Two meshing screw rotors compress refrigerant
  • Pros: Excellent for large-capacity continuous operation
  • Cons: Expensive, oil management critical
  • Common use: Medium to large industrial refrigeration systems

▶ Classification by structure:
• Hermetic — Motor and compressor integrated, replace as a unit
• Semi-hermetic — Bolted apart, field-serviceable
• Open — Motor separate, mainly used with ammonia`,
    content_zh: `▶ 往复式 (Reciprocating)
  活塞往复运动压缩制冷剂
  • 优点: 维护性好,适合低温 (-40°C 以下)
  • 缺点: 振动/噪音大,需严格管理润滑油
  • 主要用途: 冷冻仓库,低温设备

▶ 涡旋式 (Scroll)
  两个相互啮合的螺旋盘压缩制冷剂
  • 优点: 安静、高效、最为普遍
  • 缺点: 禁止反转,不可拆解
  • 主要用途: 展示柜,整体式空调

▶ 转子式 (Rotary)
  转子旋转压缩制冷剂
  • 优点: 小型轻量、价格低
  • 缺点: 不耐高压
  • 主要用途: 小型冰箱,空调

▶ 螺杆式 (Screw)
  两个螺杆转子啮合压缩制冷剂
  • 优点: 适合大容量连续运行
  • 缺点: 价格高,需严格管理润滑油
  • 主要用途: 中大型工业制冷系统

▶ 按结构分类:
• 全封闭式 — 电机与压缩机一体,整体更换
• 半封闭式 — 螺栓可拆,可现场维修
• 开放式 — 电机分离,主要用于氨系统`,
    content_ja: `▶ 往復動式 (Reciprocating)
  ピストンが往復して圧縮
  • 長所: 整備性が良い、低温(-40°C以下)に強い
  • 短所: 振動/騒音大、オイル管理重要
  • 主な用途: 冷凍倉庫、低温装置

▶ スクロール式 (Scroll)
  渦巻型が2つかみ合って圧縮
  • 長所: 静か、効率良し、最も一般的
  • 短所: 逆回転禁止、分解不可
  • 主な用途: ショーケース、パッケージエアコン

▶ ロータリー式 (Rotary)
  ロータが回転して圧縮
  • 長所: 小型・軽量、安価
  • 短所: 高圧に弱い
  • 主な用途: 小型冷蔵庫、エアコン

▶ スクリュー式 (Screw)
  2つのスクリューロータで圧縮
  • 長所: 大容量連続運転に強い
  • 短所: 高価、オイル管理重要
  • 主な用途: 中大型産業用冷凍機

▶ 構造別分類:
• 密閉型 — モータ+圧縮機一体、丸ごと交換
• 半密閉型 — ボルト分解可能、整備可能
• 開放型 — モータ分離、主にアンモニア用`,
    content_es: `▶ Reciprocante (Reciprocating)
  El pistón se mueve hacia adelante y atrás para comprimir
  • Ventajas: Buena serviciabilidad, soporta bajas temperaturas (-40°C y menores)
  • Desventajas: Alta vibración/ruido, gestión de aceite crítica
  • Uso común: Cámaras de congelación, equipos de baja temperatura

▶ Scroll
  Dos espirales entrelazadas comprimen el refrigerante
  • Ventajas: Silencioso, eficiente, el más usado
  • Desventajas: Sin rotación inversa, no se puede desarmar en campo
  • Uso común: Vitrinas, aires acondicionados tipo paquete

▶ Rotativo (Rotary)
  Un rotor giratorio comprime el refrigerante
  • Ventajas: Compacto, ligero, económico
  • Desventajas: Débil ante altas presiones
  • Uso común: Refrigeradores pequeños, aires acondicionados

▶ Tornillo (Screw)
  Dos rotores helicoidales comprimen el refrigerante
  • Ventajas: Excelente para operación continua de gran capacidad
  • Desventajas: Costoso, gestión de aceite crítica
  • Uso común: Sistemas industriales medianos y grandes

▶ Clasificación por estructura:
• Hermético — Motor y compresor integrados, se reemplaza como unidad
• Semi-hermético — Desmontable por pernos, mantenible en campo
• Abierto — Motor separado, principalmente con amoníaco`,
    content_hi: `▶ Reciprocating (पिस्टन)
  पिस्टन आगे-पीछे चलकर रेफ्रिजरेंट को compress करता है
  • फायदे: अच्छी serviceability, कम तापमान (-40°C और नीचे) के लिए मजबूत
  • नुकसान: उच्च vibration/शोर, oil management महत्वपूर्ण
  • सामान्य उपयोग: Frozen storage, low-temperature उपकरण

▶ Scroll
  दो आपस में जुड़े spiral scroll रेफ्रिजरेंट compress करते हैं
  • फायदे: शांत, कुशल, सबसे ज़्यादा उपयोग
  • नुकसान: Reverse rotation निषिद्ध, field में खोला नहीं जा सकता
  • सामान्य उपयोग: Display cases, package AC

▶ Rotary
  घूमता हुआ rotor रेफ्रिजरेंट को compress करता है
  • फायदे: छोटा, हल्का, सस्ता
  • नुकसान: उच्च दबाव पर कमज़ोर
  • सामान्य उपयोग: छोटे रेफ्रिजरेटर, एयर कंडीशनर

▶ Screw
  दो meshing screw rotors रेफ्रिजरेंट को compress करते हैं
  • फायदे: बड़ी क्षमता के निरंतर operation के लिए उत्कृष्ट
  • नुकसान: महंगा, oil management महत्वपूर्ण
  • सामान्य उपयोग: मध्यम से बड़े industrial रेफ्रिजरेशन

▶ संरचना के अनुसार वर्गीकरण:
• Hermetic — मोटर और कंप्रेसर एकीकृत, इकाई के रूप में बदलें
• Semi-hermetic — बोल्ट से अलग, field-serviceable
• Open — मोटर अलग, मुख्यतः ammonia के साथ`,
    content_vi: `▶ Piston (Reciprocating)
  Piston chuyển động qua lại để nén gas
  • Ưu điểm: Dễ bảo trì, hoạt động tốt ở nhiệt độ thấp (-40°C trở xuống)
  • Nhược điểm: Rung/tiếng ồn lớn, quản lý dầu quan trọng
  • Dùng phổ biến: Kho đông, thiết bị nhiệt độ thấp

▶ Scroll
  Hai cuộn xoắn ăn khớp để nén gas
  • Ưu điểm: Êm, hiệu quả, phổ biến nhất
  • Nhược điểm: Cấm quay ngược, không tháo được
  • Dùng phổ biến: Tủ trưng bày, điều hòa nguyên cụm

▶ Rotary
  Rotor xoay để nén gas
  • Ưu điểm: Nhỏ gọn, nhẹ, giá rẻ
  • Nhược điểm: Yếu khi áp cao
  • Dùng phổ biến: Tủ lạnh nhỏ, điều hòa

▶ Trục vít (Screw)
  Hai rotor trục vít ăn khớp để nén gas
  • Ưu điểm: Vận hành liên tục công suất lớn rất tốt
  • Nhược điểm: Đắt, quản lý dầu quan trọng
  • Dùng phổ biến: Hệ thống lạnh công nghiệp trung và lớn

▶ Phân loại theo kết cấu:
• Kín hoàn toàn (Hermetic) — Mô-tơ + máy nén liền khối, thay nguyên cụm
• Bán kín (Semi-hermetic) — Tháo bu-lông, bảo trì được
• Mở (Open) — Mô-tơ tách rời, chủ yếu dùng cho amoniac`,
    content_th: `▶ ลูกสูบ (Reciprocating)
  ลูกสูบเคลื่อนที่กลับไปกลับมาเพื่ออัดน้ำยา
  • ข้อดี: ซ่อมบำรุงดี, ทนอุณหภูมิต่ำ (-40°C หรือต่ำกว่า)
  • ข้อเสีย: สั่นสะเทือน/เสียงดัง, ต้องดูแลน้ำมันเข้มงวด
  • ใช้งาน: คลังแช่แข็ง, อุปกรณ์อุณหภูมิต่ำ

▶ สโครล (Scroll)
  สโครลเกลียวสองตัวขบกันเพื่ออัดน้ำยา
  • ข้อดี: เงียบ, ประสิทธิภาพดี, ใช้แพร่หลายที่สุด
  • ข้อเสีย: ห้ามหมุนกลับ, ไม่สามารถถอดได้
  • ใช้งาน: ตู้โชว์, แอร์แบบแพ็คเกจ

▶ โรตารี (Rotary)
  โรเตอร์หมุนเพื่ออัดน้ำยา
  • ข้อดี: ขนาดเล็ก น้ำหนักเบา ราคาถูก
  • ข้อเสีย: อ่อนแอที่แรงดันสูง
  • ใช้งาน: ตู้เย็นเล็ก, เครื่องปรับอากาศ

▶ สกรู (Screw)
  สกรูโรเตอร์สองตัวขบกันเพื่ออัดน้ำยา
  • ข้อดี: เดินเครื่องต่อเนื่องกำลังสูงดีเยี่ยม
  • ข้อเสีย: ราคาแพง, ต้องดูแลน้ำมัน
  • ใช้งาน: ระบบทำความเย็นอุตสาหกรรมขนาดกลาง-ใหญ่

▶ การจำแนกตามโครงสร้าง:
• แบบฮ่อม (Hermetic) — มอเตอร์+คอมเพรสเซอร์อยู่ในชุดเดียว, เปลี่ยนทั้งชุด
• กึ่งฮ่อม (Semi-hermetic) — แยกด้วยโบลต์, ซ่อมบำรุงได้
• แบบเปิด (Open) — มอเตอร์แยก, ใช้กับแอมโมเนียเป็นหลัก`,
    content_id: `▶ Reciprocating (Piston)
  Piston bergerak maju-mundur untuk memampatkan refrigeran
  • Kelebihan: Mudah diservis, tahan suhu rendah (-40°C atau lebih rendah)
  • Kekurangan: Getaran/kebisingan tinggi, manajemen oli penting
  • Penggunaan: Cold storage beku, peralatan suhu rendah

▶ Scroll
  Dua scroll spiral saling berkait memampatkan refrigeran
  • Kelebihan: Tenang, efisien, paling umum digunakan
  • Kekurangan: Dilarang berputar terbalik, tidak bisa dibongkar
  • Penggunaan: Showcase, AC paket

▶ Rotary
  Rotor berputar memampatkan refrigeran
  • Kelebihan: Compact, ringan, murah
  • Kekurangan: Lemah pada tekanan tinggi
  • Penggunaan: Kulkas kecil, AC

▶ Screw
  Dua rotor sekrup yang saling berkait memampatkan refrigeran
  • Kelebihan: Sangat baik untuk operasi kontinu kapasitas besar
  • Kekurangan: Mahal, manajemen oli penting
  • Penggunaan: Sistem refrigerasi industri menengah-besar

▶ Klasifikasi berdasarkan struktur:
• Hermetic — Motor + kompresor menyatu, ganti satu unit
• Semi-hermetic — Bisa dibongkar dengan baut, dapat diservis
• Open — Motor terpisah, terutama untuk amonia`,
    content_ar: `▶ ترددي (Reciprocating)
  مكبس يتحرك ذهاباً وإياباً لضغط الفريون
  • المزايا: قابلية صيانة جيدة، مناسب لدرجات الحرارة المنخفضة (-40°م وأقل)
  • العيوب: اهتزاز/ضوضاء عالية، إدارة الزيت ضرورية
  • الاستخدام الشائع: مستودعات التجميد، معدات درجة الحرارة المنخفضة

▶ سكرول (Scroll)
  لولبان متشابكان يضغطان الفريون
  • المزايا: هادئ، عالي الكفاءة، الأكثر شيوعاً
  • العيوب: ممنوع الدوران العكسي، غير قابل للفك
  • الاستخدام الشائع: خزائن العرض، مكيفات الحزمة

▶ دوار (Rotary)
  دوار يضغط الفريون بالدوران
  • المزايا: صغير، خفيف، رخيص
  • العيوب: ضعيف عند الضغط العالي
  • الاستخدام الشائع: الثلاجات الصغيرة، المكيفات

▶ لولبي (Screw)
  زوج من دوارات اللولب يضغطان الفريون
  • المزايا: ممتاز للتشغيل المستمر بسعة كبيرة
  • العيوب: غالي الثمن، إدارة الزيت ضرورية
  • الاستخدام الشائع: أنظمة التبريد الصناعية المتوسطة والكبيرة

▶ التصنيف حسب البنية:
• محكم الإغلاق (Hermetic) — المحرك والضاغط في وحدة واحدة، يُستبدل كاملاً
• شبه محكم (Semi-hermetic) — يفك بالبراغي، قابل للصيانة الميدانية
• مفتوح (Open) — المحرك منفصل، يُستخدم بشكل رئيسي مع الأمونيا`,
  },
  {
    id: 'temp_range',
    title: '사용 온도 범위',
    title_en: 'Operating Temperature Ranges',
    title_zh: '使用温度范围',
    title_ja: '使用温度範囲',
    title_es: 'Rangos de temperatura de operación',
    title_hi: 'ऑपरेटिंग तापमान रेंज',
    title_vi: 'Dải nhiệt độ vận hành',
    title_th: 'ช่วงอุณหภูมิใช้งาน',
    title_id: 'Rentang suhu operasi',
    title_ar: 'نطاقات حرارة التشغيل',
    icon: '🌡️',
    content: `냉장과 냉동은 완전히 다른 시스템입니다.

▶ 온도별 구분:
• 고온용: +5 ~ +15°C (음료 냉장, 화훼 보관)
• 중온용: 0 ~ +5°C (식재료 냉장)
• 저온용: -5 ~ -25°C (냉동식품)
• 초저온용: -25 ~ -60°C (참치, 의료용)

▶ 창고 온도 기준:
• 냉장창고: 0 ~ +10°C
• 냉동창고: -18°C 이하 (식품위생법 기준)
• 급속냉동: -35°C 이하

▶ 쇼케이스 온도:
• 냉장 쇼케이스: +2 ~ +8°C
• 냉동 쇼케이스: -18 ~ -22°C
• 아이스크림: -20 ~ -25°C

▶ 현장 팁:
온도대가 다르면 냉매, 오일, 압축기가 달라집니다.
같은 R-404A라도 냉장용/냉동용 설정값이 다릅니다.`,
    content_en: `Refrigeration and freezing are completely different systems.

▶ Temperature classification:
• High-temperature: +5 ~ +15°C (beverage cooling, floral storage)
• Medium-temperature: 0 ~ +5°C (fresh food refrigeration)
• Low-temperature: -5 ~ -25°C (frozen food)
• Ultra-low temperature: -25 ~ -60°C (tuna, medical/research use)

▶ Cold storage temperature standards:
• Refrigerated warehouse: 0 ~ +10°C
• Frozen warehouse: -18°C or below (food safety regulation)
• Blast freezing: -35°C or below

▶ Display case temperatures:
• Refrigerated display case: +2 ~ +8°C
• Frozen display case: -18 ~ -22°C
• Ice cream: -20 ~ -25°C

▶ Field tip:
Different temperature ranges require different refrigerants, oils, and compressors.
Even with the same R-404A, setpoints differ between refrigeration and freezer applications.`,
    content_zh: `冷藏与冷冻是完全不同的系统。

▶ 按温度分类:
• 高温用: +5 ~ +15°C (饮料冷藏、花卉保存)
• 中温用: 0 ~ +5°C (生鲜食品冷藏)
• 低温用: -5 ~ -25°C (冷冻食品)
• 超低温用: -25 ~ -60°C (金枪鱼、医疗用)

▶ 仓库温度标准:
• 冷藏仓库: 0 ~ +10°C
• 冷冻仓库: -18°C 以下 (食品卫生法标准)
• 速冻: -35°C 以下

▶ 展示柜温度:
• 冷藏展示柜: +2 ~ +8°C
• 冷冻展示柜: -18 ~ -22°C
• 冰淇淋: -20 ~ -25°C

▶ 现场提示:
温度范围不同,制冷剂、润滑油、压缩机也不同。
即使同为 R-404A,冷藏用和冷冻用的设定值也不一样。`,
    content_ja: `冷蔵と冷凍は完全に異なるシステムです。

▶ 温度別の区分:
• 高温用: +5 ~ +15°C (飲料冷蔵、花卉保管)
• 中温用: 0 ~ +5°C (生鮮食品冷蔵)
• 低温用: -5 ~ -25°C (冷凍食品)
• 超低温用: -25 ~ -60°C (マグロ、医療用)

▶ 倉庫温度基準:
• 冷蔵倉庫: 0 ~ +10°C
• 冷凍倉庫: -18°C 以下 (食品衛生法基準)
• 急速冷凍: -35°C 以下

▶ ショーケース温度:
• 冷蔵ショーケース: +2 ~ +8°C
• 冷凍ショーケース: -18 ~ -22°C
• アイスクリーム: -20 ~ -25°C

▶ 現場のコツ:
温度帯が違えば冷媒、オイル、圧縮機も変わります。
同じR-404Aでも冷蔵用/冷凍用の設定値が異なります。`,
    content_es: `La refrigeración y la congelación son sistemas completamente diferentes.

▶ Clasificación por temperatura:
• Alta temperatura: +5 ~ +15°C (enfriamiento de bebidas, conservación floral)
• Media temperatura: 0 ~ +5°C (refrigeración de alimentos frescos)
• Baja temperatura: -5 ~ -25°C (alimentos congelados)
• Ultra baja temperatura: -25 ~ -60°C (atún, uso médico/investigación)

▶ Estándares de temperatura para almacenes:
• Almacén refrigerado: 0 ~ +10°C
• Almacén congelado: -18°C o menos (regulación sanitaria)
• Congelación rápida: -35°C o menos

▶ Temperaturas en vitrinas:
• Vitrina refrigerada: +2 ~ +8°C
• Vitrina congelada: -18 ~ -22°C
• Helados: -20 ~ -25°C

▶ Consejo de campo:
Distintos rangos de temperatura requieren distintos refrigerantes, aceites y compresores.
Incluso con el mismo R-404A, los puntos de ajuste difieren entre aplicaciones de refrigeración y congelación.`,
    content_hi: `रेफ्रिजरेशन और फ्रीजिंग पूरी तरह अलग सिस्टम हैं।

▶ तापमान के अनुसार वर्गीकरण:
• उच्च तापमान: +5 ~ +15°C (पेय शीतलन, फूल भंडारण)
• मध्यम तापमान: 0 ~ +5°C (ताज़ा खाद्य रेफ्रिजरेशन)
• निम्न तापमान: -5 ~ -25°C (फ्रोजन फूड)
• अति-निम्न तापमान: -25 ~ -60°C (टूना, चिकित्सा उपयोग)

▶ कोल्ड स्टोरेज तापमान मानक:
• रेफ्रिजरेटेड वेयरहाउस: 0 ~ +10°C
• फ्रोजन वेयरहाउस: -18°C या नीचे (खाद्य सुरक्षा मानक)
• Blast freezing: -35°C या नीचे

▶ Display case तापमान:
• रेफ्रिजरेटेड display case: +2 ~ +8°C
• फ्रोजन display case: -18 ~ -22°C
• आइसक्रीम: -20 ~ -25°C

▶ फील्ड टिप:
अलग तापमान रेंज के लिए अलग रेफ्रिजरेंट, oil, और compressor चाहिए।
एक ही R-404A भी रेफ्रिजरेशन/फ्रीजर के लिए setpoint अलग होते हैं।`,
    content_vi: `Làm lạnh (cấp đông) và làm mát (cấp lạnh) là hai hệ thống hoàn toàn khác nhau.

▶ Phân loại theo nhiệt độ:
• Nhiệt độ cao: +5 ~ +15°C (làm lạnh đồ uống, bảo quản hoa)
• Nhiệt độ trung: 0 ~ +5°C (bảo quản thực phẩm tươi)
• Nhiệt độ thấp: -5 ~ -25°C (thực phẩm đông)
• Cực thấp: -25 ~ -60°C (cá ngừ, y tế/nghiên cứu)

▶ Tiêu chuẩn nhiệt độ kho:
• Kho lạnh: 0 ~ +10°C
• Kho đông: -18°C trở xuống (theo quy định an toàn thực phẩm)
• Cấp đông nhanh: -35°C trở xuống

▶ Nhiệt độ tủ trưng bày:
• Tủ trưng bày lạnh: +2 ~ +8°C
• Tủ trưng bày đông: -18 ~ -22°C
• Kem: -20 ~ -25°C

▶ Mẹo hiện trường:
Dải nhiệt độ khác nhau cần gas, dầu, máy nén khác nhau.
Cùng R-404A nhưng setpoint cho cấp lạnh và cấp đông khác nhau.`,
    content_th: `ระบบทำความเย็นและระบบแช่แข็งเป็นระบบที่ต่างกันโดยสิ้นเชิง

▶ การจำแนกตามอุณหภูมิ:
• อุณหภูมิสูง: +5 ~ +15°C (เครื่องดื่ม, ดอกไม้)
• อุณหภูมิกลาง: 0 ~ +5°C (อาหารสด)
• อุณหภูมิต่ำ: -5 ~ -25°C (อาหารแช่แข็ง)
• อุณหภูมิต่ำมาก: -25 ~ -60°C (ปลาทูน่า, การแพทย์)

▶ มาตรฐานอุณหภูมิคลังเก็บ:
• คลังเก็บความเย็น: 0 ~ +10°C
• คลังแช่แข็ง: -18°C หรือต่ำกว่า (ตามมาตรฐานอนามัยอาหาร)
• แช่แข็งเร็ว: -35°C หรือต่ำกว่า

▶ อุณหภูมิตู้โชว์:
• ตู้โชว์แช่เย็น: +2 ~ +8°C
• ตู้โชว์แช่แข็ง: -18 ~ -22°C
• ไอศกรีม: -20 ~ -25°C

▶ เคล็ดลับงานสนาม:
ช่วงอุณหภูมิต่างกัน น้ำยา น้ำมัน คอมเพรสเซอร์ก็ต่าง
แม้เป็น R-404A เหมือนกัน ค่าตั้งสำหรับงานเย็นและงานแข็งก็ต่างกัน`,
    content_id: `Refrigerasi dan freezing adalah sistem yang sepenuhnya berbeda.

▶ Klasifikasi berdasarkan suhu:
• Suhu tinggi: +5 ~ +15°C (pendingin minuman, penyimpanan bunga)
• Suhu menengah: 0 ~ +5°C (refrigerasi makanan segar)
• Suhu rendah: -5 ~ -25°C (makanan beku)
• Ultra rendah: -25 ~ -60°C (tuna, medis/riset)

▶ Standar suhu cold storage:
• Cold storage: 0 ~ +10°C
• Freezer storage: -18°C atau lebih rendah (regulasi keamanan pangan)
• Blast freezing: -35°C atau lebih rendah

▶ Suhu showcase:
• Showcase refrigerasi: +2 ~ +8°C
• Showcase freezer: -18 ~ -22°C
• Ice cream: -20 ~ -25°C

▶ Tip lapangan:
Rentang suhu berbeda membutuhkan refrigeran, oli, dan kompresor berbeda.
Bahkan dengan R-404A yang sama, setpoint untuk pendingin dan freezer berbeda.`,
    content_ar: `التبريد والتجميد نظامان مختلفان تماماً.

▶ التصنيف حسب درجة الحرارة:
• درجة عالية: +5 ~ +15°م (تبريد المشروبات، حفظ الزهور)
• درجة متوسطة: 0 ~ +5°م (تبريد الأطعمة الطازجة)
• درجة منخفضة: -5 ~ -25°م (الأطعمة المجمدة)
• درجة منخفضة جداً: -25 ~ -60°م (التونا، الاستخدام الطبي/البحثي)

▶ معايير درجة حرارة المستودعات:
• مستودع مبرد: 0 ~ +10°م
• مستودع تجميد: -18°م أو أقل (لائحة سلامة الغذاء)
• تجميد سريع: -35°م أو أقل

▶ درجات حرارة خزائن العرض:
• خزانة عرض مبردة: +2 ~ +8°م
• خزانة عرض مجمدة: -18 ~ -22°م
• الآيس كريم: -20 ~ -25°م

▶ نصيحة ميدانية:
نطاقات حرارة مختلفة تتطلب مواد تبريد وزيوت وضواغط مختلفة.
حتى مع نفس R-404A، تختلف نقاط الضبط بين تطبيقات التبريد والتجميد.`,
  },
  {
    id: 'refrigerants',
    title: '냉매 종류와 특성',
    title_en: 'Refrigerant Types and Properties',
    title_zh: '制冷剂种类与特性',
    title_ja: '冷媒の種類と特性',
    title_es: 'Tipos y propiedades de refrigerantes',
    title_hi: 'रेफ्रिजरेंट के प्रकार और गुण',
    title_vi: 'Các loại gas lạnh và đặc tính',
    title_th: 'ประเภทและคุณสมบัติของน้ำยาทำความเย็น',
    title_id: 'Jenis dan sifat refrigeran',
    title_ar: 'أنواع وخصائص مواد التبريد',
    icon: '💧',
    content: `▶ 현장에서 가장 많이 만나는 냉매:

R-22 (HCFC)
• 냉장/냉동 범용, 단계적 규제 중
• 대체재: R-407C, R-422D

R-404A (HFC)
• 저온 냉동 대표, 쇼케이스/냉동창고
• 대체재: R-448A, R-449A (환경규제)

R-134a (HFC)
• 자동차 에어컨, 중온 냉동기
• 온난화지수 낮음

R-410A (HFC)
• 에어컨 대표 냉매, 고압
• 누설 시 전량 교체 (혼합냉매)

R-32 (HFC)
• 신형 에어컨, 가연성 주의

▶ 자연 냉매:
• R-717 (암모니아) — 효율 최고, 독성 주의, 자격증 필요
• R-744 (CO₂) — 초고압, 친환경, 마트/물류 확대
• R-290 (프로판) — 소형 친환경, 가연성 주의

▶ 냉매 취급 시 주의:
• 피부/눈에 닿으면 동상 위험
• 밀폐 공간 누설 시 산소 결핍 위험
• 반드시 회수기로 회수 후 작업`,
    content_en: `▶ Most commonly encountered refrigerants in the field:

R-22 (HCFC)
• General-purpose refrigeration/freezing, being phased out
• Replacements: R-407C, R-422D

R-404A (HFC)
• Standard low-temperature refrigerant, used in display cases and frozen warehouses
• Replacements: R-448A, R-449A (environmental regulations)

R-134a (HFC)
• Automotive air conditioning, medium-temperature refrigeration
• Lower global warming potential

R-410A (HFC)
• Standard air conditioning refrigerant, high pressure
• Must replace entire charge if leaked (blended refrigerant)

R-32 (HFC)
• New-generation air conditioners, flammable — use caution

▶ Natural refrigerants:
• R-717 (Ammonia) — Highest efficiency, toxic, requires certification
• R-744 (CO₂) — Ultra-high pressure, eco-friendly, expanding in supermarkets/logistics
• R-290 (Propane) — Small-scale eco-friendly, flammable — use caution

▶ Refrigerant handling precautions:
• Contact with skin/eyes causes frostbite risk
• Leaks in enclosed spaces cause oxygen deficiency risk
• Always recover refrigerant with a recovery machine before servicing`,
    content_zh: `▶ 现场最常见的制冷剂:

R-22 (HCFC)
• 冷藏/冷冻通用,正在逐步淘汰
• 替代品: R-407C, R-422D

R-404A (HFC)
• 低温制冷代表,用于展示柜/冷冻仓库
• 替代品: R-448A, R-449A (环境法规)

R-134a (HFC)
• 汽车空调,中温制冷系统
• 全球变暖潜值较低

R-410A (HFC)
• 空调代表性制冷剂,高压
• 泄漏时必须全量更换 (混合制冷剂)

R-32 (HFC)
• 新型空调,可燃性需注意

▶ 自然制冷剂:
• R-717 (氨) — 效率最高,有毒,需资质证书
• R-744 (CO₂) — 超高压,环保,超市/物流广泛使用
• R-290 (丙烷) — 小型环保,可燃性需注意

▶ 制冷剂处理注意事项:
• 接触皮肤/眼睛会有冻伤风险
• 密闭空间泄漏有缺氧风险
• 作业前必须使用回收机回收`,
    content_ja: `▶ 現場で最もよく使われる冷媒:

R-22 (HCFC)
• 冷蔵/冷凍汎用、段階的に規制中
• 代替: R-407C, R-422D

R-404A (HFC)
• 低温冷凍の代表、ショーケース/冷凍倉庫
• 代替: R-448A, R-449A (環境規制)

R-134a (HFC)
• 自動車エアコン、中温冷凍機
• 温暖化指数低い

R-410A (HFC)
• エアコン代表冷媒、高圧
• 漏洩時は全量交換 (混合冷媒)

R-32 (HFC)
• 新型エアコン、可燃性注意

▶ 自然冷媒:
• R-717 (アンモニア) — 効率最高、毒性注意、資格必要
• R-744 (CO₂) — 超高圧、環境配慮、スーパー/物流で拡大
• R-290 (プロパン) — 小型環境配慮、可燃性注意

▶ 冷媒取扱い時の注意:
• 皮膚/目に触れると凍傷の危険
• 密閉空間での漏洩は酸欠の危険
• 必ず回収機で回収後に作業`,
    content_es: `▶ Refrigerantes más comunes en el campo:

R-22 (HCFC)
• Refrigeración/congelación de uso general, en eliminación gradual
• Reemplazos: R-407C, R-422D

R-404A (HFC)
• Refrigerante estándar de baja temperatura, vitrinas y cámaras frigoríficas
• Reemplazos: R-448A, R-449A (regulaciones ambientales)

R-134a (HFC)
• Aires acondicionados automotrices, refrigeración de temperatura media
• Menor potencial de calentamiento global

R-410A (HFC)
• Refrigerante estándar de aire acondicionado, alta presión
• Si hay fuga debe reemplazarse toda la carga (refrigerante mezclado)

R-32 (HFC)
• Aires acondicionados de nueva generación, inflamable — precaución

▶ Refrigerantes naturales:
• R-717 (Amoníaco) — Mayor eficiencia, tóxico, requiere certificación
• R-744 (CO₂) — Presión muy alta, ecológico, en expansión en supermercados/logística
• R-290 (Propano) — Pequeña escala ecológico, inflamable — precaución

▶ Precauciones al manejar refrigerante:
• Contacto con piel/ojos causa riesgo de congelación
• Fugas en espacios cerrados causan riesgo de deficiencia de oxígeno
• Siempre recuperar el refrigerante con una máquina de recuperación antes de servicio`,
    content_hi: `▶ फील्ड में सबसे अधिक पाए जाने वाले रेफ्रिजरेंट:

R-22 (HCFC)
• सामान्य रेफ्रिजरेशन/फ्रीजिंग, चरणबद्ध तरीके से हटाया जा रहा है
• विकल्प: R-407C, R-422D

R-404A (HFC)
• निम्न तापमान का मानक रेफ्रिजरेंट, display case/frozen warehouse
• विकल्प: R-448A, R-449A (पर्यावरण नियम)

R-134a (HFC)
• Automotive AC, मध्यम तापमान रेफ्रिजरेशन
• कम global warming potential

R-410A (HFC)
• AC का मानक रेफ्रिजरेंट, उच्च दबाव
• Leak होने पर पूरा charge बदलना ज़रूरी (mixed refrigerant)

R-32 (HFC)
• नई पीढ़ी के AC, ज्वलनशील — सावधानी

▶ Natural रेफ्रिजरेंट:
• R-717 (अमोनिया) — उच्चतम efficiency, विषैला, certification ज़रूरी
• R-744 (CO₂) — अति उच्च दबाव, eco-friendly, supermarkets/logistics में बढ़ रहा है
• R-290 (Propane) — छोटे पैमाने पर eco-friendly, ज्वलनशील — सावधानी

▶ रेफ्रिजरेंट संभालने में सावधानी:
• त्वचा/आंखों के संपर्क में frostbite का खतरा
• बंद जगह में leak से ऑक्सीजन की कमी का खतरा
• सर्विसिंग से पहले हमेशा recovery machine से recover करें`,
    content_vi: `▶ Các loại gas lạnh thường gặp nhất tại hiện trường:

R-22 (HCFC)
• Đa dụng cho lạnh/đông, đang loại bỏ dần
• Thay thế: R-407C, R-422D

R-404A (HFC)
• Tiêu chuẩn cho cấp đông thấp, tủ trưng bày/kho đông
• Thay thế: R-448A, R-449A (quy định môi trường)

R-134a (HFC)
• Điều hòa ô tô, hệ thống lạnh trung
• Chỉ số ấm lên toàn cầu thấp hơn

R-410A (HFC)
• Tiêu chuẩn cho điều hòa, áp cao
• Khi rò phải nạp lại toàn bộ (gas pha trộn)

R-32 (HFC)
• Điều hòa thế hệ mới, dễ cháy — thận trọng

▶ Gas tự nhiên:
• R-717 (Amoniac) — Hiệu suất cao nhất, độc, cần chứng chỉ
• R-744 (CO₂) — Áp cực cao, thân thiện môi trường, đang mở rộng ở siêu thị/logistics
• R-290 (Propane) — Quy mô nhỏ thân thiện môi trường, dễ cháy — thận trọng

▶ Lưu ý khi xử lý gas:
• Tiếp xúc da/mắt có nguy cơ bỏng lạnh
• Rò trong không gian kín có nguy cơ thiếu oxy
• Luôn thu hồi gas bằng máy thu hồi trước khi sửa chữa`,
    content_th: `▶ น้ำยาทำความเย็นที่พบบ่อยที่สุดในงานสนาม:

R-22 (HCFC)
• ใช้ทั่วไปสำหรับแช่เย็น/แช่แข็ง อยู่ระหว่างการยกเลิก
• สารทดแทน: R-407C, R-422D

R-404A (HFC)
• น้ำยามาตรฐานสำหรับงานแช่แข็งอุณหภูมิต่ำ ตู้โชว์/คลังแช่แข็ง
• สารทดแทน: R-448A, R-449A (ตามกฎหมายสิ่งแวดล้อม)

R-134a (HFC)
• แอร์รถยนต์ ระบบทำความเย็นอุณหภูมิกลาง
• ค่าศักยภาพภาวะโลกร้อนต่ำ

R-410A (HFC)
• น้ำยามาตรฐานเครื่องปรับอากาศ แรงดันสูง
• เมื่อรั่วต้องเปลี่ยนทั้งระบบ (น้ำยาผสม)

R-32 (HFC)
• แอร์รุ่นใหม่ ติดไฟได้ — ระวัง

▶ น้ำยาธรรมชาติ:
• R-717 (แอมโมเนีย) — ประสิทธิภาพสูงสุด เป็นพิษ ต้องมีใบอนุญาต
• R-744 (CO₂) — แรงดันสูงมาก เป็นมิตรต่อสิ่งแวดล้อม กำลังขยายในซูเปอร์/โลจิสติกส์
• R-290 (โพรเพน) — เป็นมิตรต่อสิ่งแวดล้อมขนาดเล็ก ติดไฟได้ — ระวัง

▶ ข้อควรระวังในการจัดการน้ำยา:
• สัมผัสผิวหนัง/ดวงตาอาจเกิดอาการน้ำแข็งกัด
• การรั่วในที่ปิดอาจทำให้ขาดออกซิเจน
• ต้องดูดน้ำยากลับด้วยเครื่องดูดก่อนทำงานเสมอ`,
    content_id: `▶ Refrigeran yang paling umum ditemui di lapangan:

R-22 (HCFC)
• Serbaguna untuk pendinginan/pembekuan, sedang dihapus bertahap
• Pengganti: R-407C, R-422D

R-404A (HFC)
• Refrigeran standar suhu rendah, showcase/cold storage beku
• Pengganti: R-448A, R-449A (regulasi lingkungan)

R-134a (HFC)
• AC mobil, sistem pendingin suhu menengah
• Potensi pemanasan global lebih rendah

R-410A (HFC)
• Refrigeran standar AC, tekanan tinggi
• Jika bocor harus ganti seluruh muatan (refrigeran campuran)

R-32 (HFC)
• AC generasi baru, mudah terbakar — hati-hati

▶ Refrigeran alami:
• R-717 (Amonia) — Efisiensi tertinggi, beracun, butuh sertifikasi
• R-744 (CO₂) — Tekanan sangat tinggi, ramah lingkungan, berkembang di supermarket/logistik
• R-290 (Propana) — Skala kecil ramah lingkungan, mudah terbakar — hati-hati

▶ Peringatan penanganan refrigeran:
• Kontak kulit/mata berisiko frostbite
• Kebocoran di ruang tertutup berisiko kekurangan oksigen
• Selalu tarik refrigeran dengan mesin recovery sebelum servis`,
    content_ar: `▶ مواد التبريد الأكثر شيوعاً في الموقع:

R-22 (HCFC)
• استخدام عام للتبريد/التجميد، يجري التخلص التدريجي منه
• البدائل: R-407C, R-422D

R-404A (HFC)
• المعيار للتبريد منخفض الحرارة، خزائن العرض/المستودعات المجمدة
• البدائل: R-448A, R-449A (لوائح بيئية)

R-134a (HFC)
• تكييف السيارات، التبريد متوسط الحرارة
• إمكانية الاحتباس الحراري أقل

R-410A (HFC)
• معيار تكييف الهواء، ضغط مرتفع
• في حالة التسرب يجب استبدال الشحنة كاملة (مادة مخلوطة)

R-32 (HFC)
• تكييفات الجيل الجديد، قابل للاشتعال — احذر

▶ مواد التبريد الطبيعية:
• R-717 (الأمونيا) — الأعلى كفاءة، سامة، تتطلب شهادة
• R-744 (CO₂) — ضغط فائق، صديقة للبيئة، تتوسع في الأسواق/اللوجستيات
• R-290 (البروبان) — صديقة للبيئة على نطاق صغير، قابلة للاشتعال — احذر

▶ احتياطات التعامل مع الفريون:
• ملامسة الجلد/العين تسبب خطر التجمد
• التسرب في الأماكن المغلقة يسبب نقص الأوكسجين
• استرد الفريون دائماً بجهاز الاسترداد قبل الصيانة`,
  },
  {
    id: 'oil',
    title: '냉동기유 (오일)',
    title_en: 'Refrigeration Oil',
    title_zh: '冷冻机油 (Oil)',
    title_ja: '冷凍機油 (オイル)',
    title_es: 'Aceite de refrigeración',
    title_hi: 'रेफ्रिजरेशन ऑयल',
    title_vi: 'Dầu lạnh',
    title_th: 'น้ำมันคอมเพรสเซอร์ (เครื่องทำความเย็น)',
    title_id: 'Oli refrigerasi',
    title_ar: 'زيت التبريد',
    icon: '🛢️',
    content: `냉동기에서 오일은 압축기 보호에 매우 중요합니다.

▶ 오일의 역할:
• 압축기 내부 윤활
• 마찰열 냉각
• 기밀 유지 (가스 누설 방지)

▶ 냉매별 오일 종류:
• R-22, R-404A — 광유 (Mineral Oil) 또는 알킬벤젠유
• R-410A, R-134a — POE 오일 (에스테르계)
• R-32 — POE 오일
• 암모니아 — 광유 (냉매와 섞이지 않음)

▶ 주의사항:
• 냉매와 오일은 반드시 세트로 맞춰야 함
• POE 오일은 흡습성이 강함 → 개봉 후 빠르게 사용
• 오일 오염 → 압축기 손상 원인
• 오일 부족 → 압축기 소착(고착) 발생

▶ 현장 체크:
• 사이트 글라스에서 오일 거품 많으면 냉매 혼입 의심
• 오일 색이 검으면 오염/탄화 → 교체 필요`,
    content_en: `Oil is critically important for compressor protection in refrigeration systems.

▶ Functions of oil:
• Lubrication of compressor internals
• Cooling of friction heat
• Sealing (preventing gas leakage)

▶ Oil types by refrigerant:
• R-22, R-404A — Mineral Oil or Alkylbenzene Oil
• R-410A, R-134a — POE Oil (polyolester)
• R-32 — POE Oil
• Ammonia — Mineral Oil (does not mix with refrigerant)

▶ Precautions:
• Refrigerant and oil must always be matched correctly
• POE oil is highly hygroscopic → use quickly after opening
• Oil contamination → causes compressor damage
• Oil shortage → causes compressor seizure

▶ Field checks:
• Excessive foaming in sight glass → suspect refrigerant mixing into oil
• Dark/black oil color → contamination or carbonization → replace`,
    content_zh: `在制冷系统中,润滑油对压缩机保护至关重要。

▶ 油的作用:
• 压缩机内部润滑
• 摩擦热冷却
• 密封 (防止气体泄漏)

▶ 各制冷剂对应油品:
• R-22, R-404A — 矿物油 或 烷基苯油
• R-410A, R-134a — POE 油 (酯类)
• R-32 — POE 油
• 氨 — 矿物油 (与制冷剂不互溶)

▶ 注意事项:
• 制冷剂和油必须配套
• POE 油吸湿性强 → 开封后尽快使用
• 油污染 → 导致压缩机损坏
• 油不足 → 压缩机咬死 (烧结)

▶ 现场检查:
• 视镜内泡沫多 → 怀疑制冷剂混入油中
• 油色发黑 → 污染或碳化 → 需更换`,
    content_ja: `冷凍機においてオイルは圧縮機保護のために非常に重要です。

▶ オイルの役割:
• 圧縮機内部の潤滑
• 摩擦熱の冷却
• 気密保持 (ガス漏れ防止)

▶ 冷媒別オイルの種類:
• R-22, R-404A — 鉱油 (Mineral Oil) または アルキルベンゼン油
• R-410A, R-134a — POE油 (エステル系)
• R-32 — POE油
• アンモニア — 鉱油 (冷媒と混ざらない)

▶ 注意事項:
• 冷媒とオイルは必ず適合させる
• POE油は吸湿性が強い → 開封後は素早く使用
• オイル汚染 → 圧縮機損傷の原因
• オイル不足 → 圧縮機焼付き発生

▶ 現場チェック:
• サイトグラスに泡が多い → 冷媒混入を疑う
• オイルが黒い → 汚染/炭化 → 交換必要`,
    content_es: `El aceite es crítico para proteger el compresor en sistemas de refrigeración.

▶ Funciones del aceite:
• Lubricar el interior del compresor
• Refrigerar el calor de fricción
• Sellado (evitar fugas de gas)

▶ Tipos de aceite por refrigerante:
• R-22, R-404A — Aceite mineral o aceite alquilbenceno
• R-410A, R-134a — Aceite POE (poliolester)
• R-32 — Aceite POE
• Amoníaco — Aceite mineral (no se mezcla con el refrigerante)

▶ Precauciones:
• El refrigerante y el aceite siempre deben ser compatibles
• El aceite POE es muy higroscópico → usar rápido tras abrir
• Contaminación del aceite → daño al compresor
• Falta de aceite → agarrotamiento del compresor

▶ Comprobaciones en campo:
• Mucha espuma en la mirilla → sospechar mezcla de refrigerante con aceite
• Aceite oscuro/negro → contaminación o carbonización → reemplazar`,
    content_hi: `रेफ्रिजरेशन सिस्टम में oil compressor की सुरक्षा के लिए अत्यंत महत्वपूर्ण है।

▶ Oil के कार्य:
• Compressor आंतरिक भाग का lubrication
• घर्षण की गर्मी ठंडी करना
• Sealing (gas leak रोकना)

▶ रेफ्रिजरेंट के अनुसार oil के प्रकार:
• R-22, R-404A — Mineral Oil या Alkylbenzene oil
• R-410A, R-134a — POE oil (polyolester)
• R-32 — POE oil
• Ammonia — Mineral oil (रेफ्रिजरेंट के साथ नहीं मिलता)

▶ सावधानियाँ:
• रेफ्रिजरेंट और oil हमेशा सही जोड़ी में होने चाहिए
• POE oil अत्यधिक hygroscopic → खोलने के बाद जल्दी इस्तेमाल करें
• Oil contamination → compressor damage का कारण
• Oil की कमी → compressor seizure (फँसना)

▶ Field checks:
• Sight glass में बहुत झाग → रेफ्रिजरेंट का oil में मिलना संदिग्ध
• Oil का काला रंग → contamination या carbonization → बदलें`,
    content_vi: `Trong hệ thống lạnh, dầu rất quan trọng để bảo vệ máy nén.

▶ Vai trò của dầu:
• Bôi trơn bên trong máy nén
• Làm mát nhiệt do ma sát
• Làm kín (ngăn rò gas)

▶ Loại dầu theo từng gas:
• R-22, R-404A — Dầu khoáng hoặc dầu alkylbenzene
• R-410A, R-134a — Dầu POE (polyolester)
• R-32 — Dầu POE
• Amoniac — Dầu khoáng (không trộn với gas)

▶ Lưu ý:
• Gas và dầu phải đúng cặp
• Dầu POE hút ẩm mạnh → mở ra dùng nhanh
• Dầu nhiễm bẩn → gây hỏng máy nén
• Thiếu dầu → kẹt cứng máy nén

▶ Kiểm tra hiện trường:
• Sight glass nhiều bọt → nghi gas lẫn vào dầu
• Dầu màu đen → nhiễm bẩn/cháy → cần thay`,
    content_th: `ในระบบทำความเย็น น้ำมันมีความสำคัญต่อการปกป้องคอมเพรสเซอร์อย่างมาก

▶ บทบาทของน้ำมัน:
• หล่อลื่นภายในคอมเพรสเซอร์
• ระบายความร้อนจากแรงเสียดทาน
• ทำหน้าที่ซีล (ป้องกันการรั่วของก๊าซ)

▶ ประเภทน้ำมันตามชนิดน้ำยา:
• R-22, R-404A — Mineral Oil หรือ Alkylbenzene
• R-410A, R-134a — POE Oil (polyolester)
• R-32 — POE Oil
• แอมโมเนีย — Mineral Oil (ไม่ผสมกับน้ำยา)

▶ ข้อควรระวัง:
• น้ำยาและน้ำมันต้องเข้าคู่กันเสมอ
• POE Oil ดูดความชื้นแรง → ใช้ให้เร็วหลังเปิดฝา
• น้ำมันปนเปื้อน → ทำให้คอมเพรสเซอร์เสียหาย
• น้ำมันไม่พอ → คอมเพรสเซอร์ติด (ไหม้)

▶ ตรวจในงานสนาม:
• ฟองในไซต์กลาสมาก → สงสัยน้ำยาเข้าน้ำมัน
• สีน้ำมันดำ → ปนเปื้อน/ไหม้ → ต้องเปลี่ยน`,
    content_id: `Pada sistem refrigerasi, oli sangat penting untuk melindungi kompresor.

▶ Fungsi oli:
• Pelumasan bagian dalam kompresor
• Mendinginkan panas gesekan
• Penyegelan (mencegah kebocoran gas)

▶ Jenis oli per refrigeran:
• R-22, R-404A — Mineral Oil atau Alkylbenzene
• R-410A, R-134a — POE Oil (polyolester)
• R-32 — POE Oil
• Amonia — Mineral Oil (tidak bercampur dengan refrigeran)

▶ Peringatan:
• Refrigeran dan oli harus selalu cocok
• Oli POE sangat menyerap air → gunakan cepat setelah dibuka
• Oli terkontaminasi → menyebabkan kompresor rusak
• Kurang oli → menyebabkan kompresor macet (seizure)

▶ Pemeriksaan lapangan:
• Banyak busa di sight glass → curigai refrigeran masuk ke oli
• Warna oli hitam → terkontaminasi/karbonisasi → ganti`,
    content_ar: `في أنظمة التبريد، الزيت بالغ الأهمية لحماية الضاغط.

▶ وظائف الزيت:
• تشحيم الأجزاء الداخلية للضاغط
• تبريد حرارة الاحتكاك
• الإحكام (منع تسرب الغاز)

▶ أنواع الزيت حسب الفريون:
• R-22, R-404A — زيت معدني أو زيت Alkylbenzene
• R-410A, R-134a — زيت POE (إستر متعدد الأولات)
• R-32 — زيت POE
• الأمونيا — زيت معدني (لا يمتزج بالفريون)

▶ احتياطات:
• يجب أن يتطابق الفريون والزيت دائماً
• زيت POE ماص للرطوبة بشدة → يُستخدم بسرعة بعد فتحه
• تلوث الزيت → يسبب تلف الضاغط
• نقص الزيت → يسبب علوق (احتراق) الضاغط

▶ فحص ميداني:
• كثرة الفقاعات في زجاج الرؤية → اشتبه باختلاط الفريون بالزيت
• لون الزيت أسود → تلوث أو تكربن → استبدله`,
  },
  {
    id: 'cooling_method',
    title: '응축 방식',
    title_en: 'Condensing Methods',
    title_zh: '冷凝方式',
    title_ja: '凝縮方式',
    title_es: 'Métodos de condensación',
    title_hi: 'कंडेंसिंग विधियाँ',
    title_vi: 'Phương pháp ngưng tụ',
    title_th: 'วิธีการควบแน่น',
    title_id: 'Metode kondensasi',
    title_ar: 'طرق التكثيف',
    icon: '🌬️',
    content: `응축기에서 열을 버리는 방식에 따라 구분합니다.

▶ 공랭식 (Air Cooled)
바람으로 응축기 코일 열을 제거
• 장점: 설치 간단, 유지보수 쉬움
• 단점: 여름 고온 시 성능 저하, 먼지에 취약
• 관리: 핀 코일 청소가 핵심
  (먼지 끼면 고압 상승 → 압축기 부하 증가)

▶ 수랭식 (Water Cooled)
냉각수로 열을 제거 (냉각탑 사용)
• 장점: 효율 높음, 계절 영향 적음
• 단점: 냉각탑·펌프 추가 필요, 수질 관리 필요
• 관리: 수질 나쁘면 코일 스케일 생성 → 고압 상승

▶ 증발식 (Evaporative)
물 증발 잠열을 이용
• 장점: 고온 환경에서도 성능 유지
• 단점: 위생 관리, 동절기 동파 주의

▶ 현장 핵심:
응축기 청소만 제때 해도 냉동기 수명 2배`,
    content_en: `Classified by how the condenser rejects heat.

▶ Air Cooled
Removes condenser coil heat using airflow
• Pros: Simple installation, easy maintenance
• Cons: Performance drops in summer heat, vulnerable to dust buildup
• Maintenance: Fin coil cleaning is essential
  (Dirty fins → high discharge pressure → increased compressor load)

▶ Water Cooled
Removes heat using cooling water (cooling tower)
• Pros: High efficiency, less affected by seasons
• Cons: Requires cooling tower and pump, water quality management needed
• Maintenance: Poor water quality causes scale on coils → high discharge pressure

▶ Evaporative
Uses latent heat of water evaporation
• Pros: Maintains performance even in high-temperature environments
• Cons: Sanitation management required, freeze risk in winter

▶ Field key point:
Timely condenser cleaning alone can double the lifespan of a refrigeration system`,
    content_zh: `根据冷凝器排热方式分类。

▶ 风冷式 (Air Cooled)
通过气流移除冷凝器盘管热量
• 优点: 安装简单,维护方便
• 缺点: 夏季高温时性能下降,易受灰尘影响
• 维护: 翅片盘管清洁最关键
  (灰尘堆积 → 高压上升 → 压缩机负荷增加)

▶ 水冷式 (Water Cooled)
通过冷却水排热 (使用冷却塔)
• 优点: 效率高,受季节影响小
• 缺点: 需要冷却塔和水泵,需要水质管理
• 维护: 水质差导致盘管结垢 → 高压上升

▶ 蒸发式 (Evaporative)
利用水蒸发潜热
• 优点: 高温环境下也能保持性能
• 缺点: 需要卫生管理,冬季注意冻坏

▶ 现场要点:
仅及时清洁冷凝器,就可让制冷系统寿命翻倍`,
    content_ja: `凝縮器が熱を放出する方式により分類されます。

▶ 空冷式 (Air Cooled)
風で凝縮器コイルの熱を除去
• 長所: 設置簡単、保守容易
• 短所: 夏の高温時に性能低下、ホコリに弱い
• 管理: フィンコイル清掃が重要
  (ホコリ詰まり → 高圧上昇 → 圧縮機負荷増加)

▶ 水冷式 (Water Cooled)
冷却水で熱を除去 (冷却塔使用)
• 長所: 効率が高い、季節影響少
• 短所: 冷却塔・ポンプ追加必要、水質管理必要
• 管理: 水質悪化でコイルにスケール → 高圧上昇

▶ 蒸発式 (Evaporative)
水の蒸発潜熱を利用
• 長所: 高温環境でも性能維持
• 短所: 衛生管理、冬季の凍結注意

▶ 現場の要点:
凝縮器清掃をきちんとするだけで冷凍機の寿命が2倍`,
    content_es: `Se clasifica por la forma en que el condensador expulsa el calor.

▶ Enfriado por aire (Air Cooled)
Elimina el calor de las bobinas del condensador con flujo de aire
• Ventajas: Instalación simple, mantenimiento fácil
• Desventajas: Rendimiento baja con altas temperaturas, vulnerable al polvo
• Mantenimiento: Limpieza de aletas es esencial
  (Aletas sucias → alta presión de descarga → mayor carga del compresor)

▶ Enfriado por agua (Water Cooled)
Elimina el calor con agua de enfriamiento (torre de enfriamiento)
• Ventajas: Alta eficiencia, menos afectado por estaciones
• Desventajas: Requiere torre de enfriamiento y bomba, manejo de calidad de agua
• Mantenimiento: Mala calidad de agua causa incrustación → alta presión

▶ Evaporativo (Evaporative)
Usa calor latente de evaporación del agua
• Ventajas: Mantiene rendimiento incluso en altas temperaturas
• Desventajas: Requiere gestión sanitaria, riesgo de congelación en invierno

▶ Punto clave de campo:
Solo con limpieza oportuna del condensador, la vida útil del sistema se puede duplicar`,
    content_hi: `Condenser गर्मी कैसे निकालता है इसके आधार पर वर्गीकरण।

▶ Air Cooled (एयर कूल्ड)
हवा से condenser coil की गर्मी निकाली जाती है
• फायदे: स्थापना आसान, रखरखाव सरल
• नुकसान: गर्मियों में प्रदर्शन कम, धूल के प्रति संवेदनशील
• रखरखाव: Fin coil सफाई महत्वपूर्ण
  (धूल जमा होने पर → discharge pressure बढ़ना → compressor load बढ़ना)

▶ Water Cooled (वॉटर कूल्ड)
ठंडे पानी से गर्मी निकाली जाती है (cooling tower)
• फायदे: उच्च कुशलता, मौसम का कम प्रभाव
• नुकसान: Cooling tower और pump ज़रूरी, water quality management
• रखरखाव: खराब पानी से coil पर scale → high pressure

▶ Evaporative (वाष्पशील)
पानी के वाष्पीकरण की गुप्त ऊष्मा का उपयोग
• फायदे: उच्च तापमान में भी प्रदर्शन बना रहता है
• नुकसान: स्वच्छता प्रबंधन, सर्दियों में जमने का जोखिम

▶ फील्ड मुख्य बिंदु:
Condenser की समय पर सफाई से सिस्टम की उम्र दोगुनी हो सकती है`,
    content_vi: `Phân loại theo cách dàn ngưng thải nhiệt.

▶ Giải nhiệt gió (Air Cooled)
Lấy nhiệt khỏi cuộn dàn ngưng bằng luồng khí
• Ưu điểm: Lắp đặt đơn giản, bảo trì dễ
• Nhược điểm: Hè nóng giảm hiệu suất, dễ nhiễm bụi
• Bảo trì: Vệ sinh cánh tản nhiệt là then chốt
  (bám bụi → áp cao tăng → tải máy nén tăng)

▶ Giải nhiệt nước (Water Cooled)
Lấy nhiệt bằng nước làm mát (tháp giải nhiệt)
• Ưu điểm: Hiệu suất cao, ít ảnh hưởng bởi mùa
• Nhược điểm: Cần tháp giải nhiệt và bơm, cần quản lý chất lượng nước
• Bảo trì: Nước kém gây cáu cặn cuộn → áp cao tăng

▶ Giải nhiệt bay hơi (Evaporative)
Dùng nhiệt ẩn bay hơi của nước
• Ưu điểm: Duy trì hiệu suất cả khi môi trường nóng
• Nhược điểm: Cần vệ sinh, mùa đông phải tránh đóng băng

▶ Điểm cốt lõi hiện trường:
Chỉ cần vệ sinh dàn ngưng đúng kỳ, tuổi thọ máy có thể tăng gấp đôi`,
    content_th: `จำแนกตามวิธีที่คอนเดนเซอร์ทิ้งความร้อน

▶ ระบายอากาศ (Air Cooled)
ใช้ลมระบายความร้อนจากคอยล์คอนเดนเซอร์
• ข้อดี: ติดตั้งง่าย ดูแลง่าย
• ข้อเสีย: ประสิทธิภาพลดในฤดูร้อน ไวต่อฝุ่น
• การดูแล: ทำความสะอาดครีบคอยล์เป็นหลัก
  (ฝุ่นจับ → แรงดันสูงเพิ่ม → คอมเพรสเซอร์โหลดสูง)

▶ ระบายด้วยน้ำ (Water Cooled)
ใช้น้ำหล่อเย็นระบายความร้อน (คูลลิ่งทาวเวอร์)
• ข้อดี: ประสิทธิภาพสูง ไม่ค่อยขึ้นกับฤดูกาล
• ข้อเสีย: ต้องมีคูลลิ่งทาวเวอร์และปั๊ม ต้องดูแลคุณภาพน้ำ
• การดูแล: คุณภาพน้ำไม่ดี → ตะกรันบนคอยล์ → แรงดันสูงเพิ่ม

▶ ระบายแบบระเหย (Evaporative)
ใช้ความร้อนแฝงจากการระเหยของน้ำ
• ข้อดี: คงประสิทธิภาพแม้ในที่ร้อน
• ข้อเสีย: ต้องดูแลความสะอาด ฤดูหนาวระวังการแข็งตัว

▶ จุดสำคัญงานสนาม:
ทำความสะอาดคอนเดนเซอร์ทันเวลาอย่างเดียว ก็ทำให้อายุระบบทำความเย็นเพิ่มขึ้นเท่าตัว`,
    content_id: `Diklasifikasikan berdasarkan cara kondensor membuang panas.

▶ Air Cooled (Pendingin Udara)
Membuang panas koil kondensor dengan aliran udara
• Kelebihan: Pemasangan sederhana, perawatan mudah
• Kekurangan: Performa turun saat musim panas, rentan debu
• Perawatan: Pembersihan sirip koil sangat penting
  (Sirip kotor → tekanan discharge naik → beban kompresor naik)

▶ Water Cooled (Pendingin Air)
Membuang panas dengan air pendingin (cooling tower)
• Kelebihan: Efisiensi tinggi, kurang terpengaruh musim
• Kekurangan: Butuh cooling tower & pompa, butuh manajemen kualitas air
• Perawatan: Kualitas air buruk → kerak pada koil → tekanan tinggi

▶ Evaporative (Penguapan)
Menggunakan panas laten penguapan air
• Kelebihan: Performa tetap di lingkungan suhu tinggi
• Kekurangan: Butuh manajemen kebersihan, risiko beku di musim dingin

▶ Poin penting lapangan:
Pembersihan kondensor tepat waktu saja bisa menggandakan usia sistem`,
    content_ar: `يُصنّف حسب طريقة طرد المكثف للحرارة.

▶ التبريد بالهواء (Air Cooled)
يزيل الحرارة من ملف المكثف بتدفق الهواء
• المزايا: تركيب بسيط، صيانة سهلة
• العيوب: انخفاض الأداء في حر الصيف، حساس للغبار
• الصيانة: تنظيف زعانف الملف ضروري
  (زعانف متسخة → ارتفاع ضغط التصريف → زيادة حمل الضاغط)

▶ التبريد بالماء (Water Cooled)
يزيل الحرارة بماء التبريد (برج التبريد)
• المزايا: كفاءة عالية، تأثر أقل بالفصول
• العيوب: يتطلب برج تبريد ومضخة، إدارة جودة المياه
• الصيانة: جودة الماء السيئة تكوّن ترسبات على الملف → ارتفاع الضغط

▶ التبريد بالتبخير (Evaporative)
يستخدم الحرارة الكامنة لتبخر الماء
• المزايا: يحافظ على الأداء حتى في البيئات الحارة
• العيوب: يحتاج إدارة صحية، خطر التجمد شتاءً

▶ نقطة ميدانية أساسية:
تنظيف المكثف في الوقت المناسب وحده يمكن أن يضاعف عمر النظام`,
  },
  {
    id: 'expansion',
    title: '팽창장치 종류',
    title_en: 'Expansion Device Types',
    title_zh: '膨胀装置类型',
    title_ja: '膨張装置の種類',
    title_es: 'Tipos de dispositivos de expansión',
    title_hi: 'एक्सपैंशन डिवाइस के प्रकार',
    title_vi: 'Các loại van tiết lưu',
    title_th: 'ประเภทอุปกรณ์ลดความดัน',
    title_id: 'Jenis perangkat ekspansi',
    title_ar: 'أنواع أجهزة التمدد',
    icon: '🔧',
    content: `냉매 압력을 낮춰 증발을 돕는 장치입니다.

▶ 모세관 (Capillary Tube)
가는 구리관으로 저항을 이용
• 소형 냉장고, 에어컨 소형
• 조정 불가 — 고정된 유량
• 냉매량 정확히 맞춰야 함

▶ TXV (온도식 팽창밸브, Thermostatic Expansion Valve)
증발기 출구 온도를 감지해 개도 조절
• 가장 많이 사용
• 과열도 5~8°C 유지
• 감온통 위치가 매우 중요
  (밀착·단열 불량 시 헌팅 발생)

▶ EEV (전자식 팽창밸브, Electronic Expansion Valve)
컨트롤러가 전자적으로 개도 조절
• 인버터 장비, 정밀 온도 제어
• 고장 시 전량 교체
• 스텝 모터 방식이 대부분

▶ 플로트식
액면 높이로 자동 조절
• 만액식 증발기 사용
• 주로 대형 냉동기

▶ 현장 팁:
TXV 문제는 헌팅(압력 출렁임)으로 나타남
EEV는 컨트롤러 에러코드 먼저 확인`,
    content_en: `Devices that reduce refrigerant pressure to promote evaporation.

▶ Capillary Tube
Uses resistance through a thin copper tube
• Small refrigerators, compact air conditioners
• Non-adjustable — fixed flow rate
• Refrigerant charge must be precisely matched

▶ TXV (Thermostatic Expansion Valve)
Senses evaporator outlet temperature and adjusts opening
• Most widely used
• Maintains superheat of 5~8°C
• Sensing bulb position is critical
  (Poor contact or insulation → hunting)

▶ EEV (Electronic Expansion Valve)
Controller electronically adjusts valve opening
• Inverter equipment, precision temperature control
• Replace entire unit if faulty
• Mostly step motor type

▶ Float Valve
Automatically adjusts based on liquid level
• Used with flooded evaporators
• Mainly large refrigeration systems

▶ Field tips:
TXV problems show up as hunting (pressure fluctuation)
For EEV, check controller error codes first`,
    content_zh: `通过降低制冷剂压力来促进蒸发的装置。

▶ 毛细管 (Capillary Tube)
利用细铜管的阻力
• 用于小型冰箱、小型空调
• 不可调节 — 流量固定
• 制冷剂量必须精确匹配

▶ TXV (温度式膨胀阀)
检测蒸发器出口温度并调节开度
• 使用最广泛
• 维持过热度 5~8°C
• 感温包位置非常重要
  (贴合或绝热不良 → 出现 hunting)

▶ EEV (电子膨胀阀)
控制器电子调节开度
• 用于变频设备、精密温度控制
• 故障时整体更换
• 大多为步进电机式

▶ 浮球阀
根据液位自动调节
• 用于满液式蒸发器
• 主要用于大型制冷机

▶ 现场提示:
TXV 问题通常表现为 hunting (压力波动)
EEV 需先检查控制器错误代码`,
    content_ja: `冷媒圧力を下げて蒸発を助ける装置です。

▶ キャピラリーチューブ (Capillary Tube)
細い銅管の抵抗を利用
• 小型冷蔵庫、小型エアコン
• 調整不可 — 固定流量
• 冷媒量を正確に合わせる必要

▶ TXV (温度式膨張弁, Thermostatic Expansion Valve)
蒸発器出口温度を感知して開度調整
• 最も広く使われる
• 過熱度 5~8°C 維持
• 感温筒の位置が非常に重要
  (密着・断熱不良 → ハンチング発生)

▶ EEV (電子膨張弁, Electronic Expansion Valve)
コントローラが電子的に開度調整
• インバータ機器、精密温度制御
• 故障時は全交換
• ステッピングモータ方式が多い

▶ フロート式
液面高さで自動調整
• 満液式蒸発器で使用
• 主に大型冷凍機

▶ 現場のコツ:
TXV不具合はハンチング(圧力変動)で現れる
EEVはコントローラのエラーコードを先に確認`,
    content_es: `Dispositivos que reducen la presión del refrigerante para favorecer la evaporación.

▶ Tubo capilar (Capillary Tube)
Usa la resistencia de un tubo de cobre delgado
• Refrigeradores pequeños, aires acondicionados compactos
• No ajustable — flujo fijo
• La carga de refrigerante debe ajustarse con precisión

▶ TXV (Válvula de expansión termostática)
Detecta la temperatura de salida del evaporador y ajusta la apertura
• La más usada
• Mantiene un sobrecalentamiento de 5~8°C
• La posición del bulbo sensor es crítica
  (Mal contacto o aislamiento → hunting)

▶ EEV (Válvula de expansión electrónica)
Un controlador ajusta la apertura electrónicamente
• Equipos inverter, control preciso de temperatura
• Si falla, reemplazar la unidad completa
• En su mayoría tipo motor paso a paso

▶ Válvula de flotador
Se ajusta automáticamente según el nivel de líquido
• Se usa con evaporadores inundados
• Principalmente sistemas grandes

▶ Consejos de campo:
Problemas en TXV se manifiestan como hunting (fluctuación de presión)
En EEV, revisar primero los códigos de error del controlador`,
    content_hi: `रेफ्रिजरेंट दबाव कम कर वाष्पीकरण को सहायक उपकरण।

▶ Capillary Tube (केशिका नली)
पतले copper tube के प्रतिरोध का उपयोग
• छोटे रेफ्रिजरेटर, कॉम्पैक्ट AC
• Non-adjustable — fixed flow rate
• रेफ्रिजरेंट चार्ज सटीक होना ज़रूरी

▶ TXV (Thermostatic Expansion Valve)
Evaporator outlet तापमान को सेंस कर opening adjust करता है
• सबसे ज़्यादा उपयोग
• Superheat 5~8°C बनाए रखता है
• Sensing bulb की स्थिति अत्यंत महत्वपूर्ण
  (खराब contact/insulation → hunting)

▶ EEV (Electronic Expansion Valve)
Controller electronically opening adjust करता है
• Inverter उपकरण, precise तापमान control
• खराब होने पर पूरी इकाई बदलें
• अधिकतर step motor प्रकार

▶ Float Valve
तरल level के आधार पर स्वचालित रूप से समायोजित
• Flooded evaporator के साथ उपयोग
• मुख्यतः बड़े रेफ्रिजरेशन सिस्टम

▶ फील्ड टिप:
TXV की समस्या hunting (दबाव में उतार-चढ़ाव) के रूप में दिखती है
EEV के लिए पहले controller error code देखें`,
    content_vi: `Thiết bị hạ áp gas để hỗ trợ bay hơi.

▶ Ống mao dẫn (Capillary Tube)
Dùng trở kháng của ống đồng nhỏ
• Tủ lạnh nhỏ, điều hòa nhỏ
• Không điều chỉnh được — lưu lượng cố định
• Phải nạp gas chính xác

▶ TXV (Van tiết lưu nhiệt)
Cảm biến nhiệt độ ra dàn bay hơi để điều chỉnh độ mở
• Dùng phổ biến nhất
• Duy trì độ quá nhiệt 5~8°C
• Vị trí bầu cảm biến rất quan trọng
  (tiếp xúc/cách nhiệt kém → hunting)

▶ EEV (Van tiết lưu điện tử)
Bộ điều khiển điều chỉnh độ mở bằng điện tử
• Thiết bị inverter, kiểm soát nhiệt độ chính xác
• Hỏng phải thay nguyên cụm
• Đa số dùng động cơ bước

▶ Van phao
Tự điều chỉnh theo mức chất lỏng
• Dùng với dàn bay hơi ngập
• Chủ yếu hệ thống lớn

▶ Mẹo hiện trường:
Lỗi TXV biểu hiện qua hunting (dao động áp)
Lỗi EEV: kiểm tra mã lỗi bộ điều khiển trước`,
    content_th: `อุปกรณ์ที่ลดแรงดันน้ำยาเพื่อช่วยการระเหย

▶ ท่อแคปิลลารี (Capillary Tube)
ใช้ความต้านทานของท่อทองแดงบาง
• ตู้เย็นเล็ก, แอร์เล็ก
• ปรับไม่ได้ — อัตราการไหลคงที่
• ต้องชั่งน้ำยาให้แม่นยำ

▶ TXV (วาล์วลดความดันแบบอุณหภูมิ)
ตรวจจับอุณหภูมิทางออกอีวาปอเรเตอร์เพื่อปรับการเปิด
• ใช้แพร่หลายที่สุด
• รักษาซูเปอร์ฮีต 5~8°C
• ตำแหน่งกระเปาะสำคัญมาก
  (สัมผัส/ฉนวนไม่ดี → เกิด hunting)

▶ EEV (วาล์วลดความดันแบบอิเล็กทรอนิกส์)
คอนโทรลเลอร์ปรับการเปิดด้วยไฟฟ้า
• อุปกรณ์อินเวอร์เตอร์, ควบคุมอุณหภูมิแม่นยำ
• เสียต้องเปลี่ยนทั้งชุด
• ส่วนใหญ่เป็นแบบ step motor

▶ วาล์วลูกลอย
ปรับโดยอัตโนมัติตามระดับของเหลว
• ใช้กับอีวาปอเรเตอร์แบบ flooded
• ส่วนใหญ่ระบบขนาดใหญ่

▶ เคล็ดลับงานสนาม:
ปัญหา TXV แสดงเป็น hunting (แรงดันแกว่ง)
EEV ให้ตรวจรหัสข้อผิดพลาดคอนโทรลเลอร์ก่อน`,
    content_id: `Perangkat yang menurunkan tekanan refrigeran untuk membantu penguapan.

▶ Capillary Tube (Pipa Kapiler)
Memanfaatkan resistansi pipa tembaga tipis
• Kulkas kecil, AC kompak
• Tidak bisa diatur — laju aliran tetap
• Muatan refrigeran harus pas

▶ TXV (Thermostatic Expansion Valve)
Mendeteksi suhu keluar evaporator dan mengatur bukaan
• Paling umum digunakan
• Menjaga superheat 5~8°C
• Posisi sensing bulb sangat penting
  (Kontak/insulasi buruk → hunting)

▶ EEV (Electronic Expansion Valve)
Pengontrol mengatur bukaan secara elektronik
• Peralatan inverter, kontrol suhu presisi
• Ganti seluruh unit jika rusak
• Mayoritas tipe step motor

▶ Float Valve (Katup Pelampung)
Otomatis menyesuaikan berdasarkan ketinggian cairan
• Digunakan dengan evaporator flooded
• Terutama sistem refrigerasi besar

▶ Tip lapangan:
Masalah TXV muncul sebagai hunting (fluktuasi tekanan)
Untuk EEV, periksa kode error pengontrol terlebih dahulu`,
    content_ar: `أجهزة تخفض ضغط الفريون لتعزيز التبخر.

▶ الأنبوب الشعري (Capillary Tube)
يستخدم مقاومة أنبوب نحاسي رفيع
• ثلاجات صغيرة، مكيفات صغيرة
• غير قابل للضبط — معدل تدفق ثابت
• يجب ضبط شحنة الفريون بدقة

▶ TXV (صمام التمدد الحراري)
يستشعر حرارة خروج المبخر ويضبط الفتحة
• الأكثر استخداماً
• يحافظ على الإحماء 5~8°م
• موقع اللمبة الحساسة بالغ الأهمية
  (سوء التلامس أو العزل → اهتزاز hunting)

▶ EEV (صمام التمدد الإلكتروني)
وحدة تحكم تضبط الفتحة إلكترونياً
• معدات الإنفرتر، تحكم دقيق بالحرارة
• استبدله كاملاً عند العطل
• معظمها بمحرك خطوي (step motor)

▶ صمام العوامة (Float Valve)
يتعدل تلقائياً حسب مستوى السائل
• يُستخدم مع المبخرات المغمورة
• خاصة في الأنظمة الكبيرة

▶ نصائح ميدانية:
مشكلات TXV تظهر كـ hunting (تذبذب الضغط)
لـ EEV: تحقق من رموز الخطأ في وحدة التحكم أولاً`,
  },
  {
    id: 'defrost',
    title: '착상과 제상',
    title_en: 'Frost Buildup and Defrost',
    title_zh: '结霜与除霜',
    title_ja: '着霜と除霜 (デフロスト)',
    title_es: 'Acumulación de hielo y desescarche',
    title_hi: 'फ्रॉस्ट जमा होना और डीफ्रॉस्ट',
    title_vi: 'Đóng tuyết và xả tuyết',
    title_th: 'การเกาะน้ำแข็งและการละลายน้ำแข็ง (ดีฟรอสต์)',
    title_id: 'Penumpukan es dan defrost',
    title_ar: 'تكوّن الصقيع وإزالة الجليد',
    icon: '🧊',
    content: `냉동기 고장 원인 1위 중 하나입니다.

▶ 착상이란?
증발기 코일에 성에(얼음)가 쌓이는 현상
• 공기 중 수분이 영하의 코일에 달라붙어 얼음이 됨
• 착상이 심해지면 공기 흐름 차단 → 냉각 불량

▶ 제상 방식:

① 자연 제상
  압축기 정지 시 실온으로 자연 해빙
  소형 냉장고, 오래 걸림

② 전기 히터 제상
  증발기 코일에 히터 설치
  가장 일반적, 타이머로 주기 제어

③ 핫가스 제상
  압축기 토출 가스로 코일 가열
  빠르고 효율적, 대형 설비에 사용

④ 역사이클 제상 (에어컨 난방)
  냉동 사이클 반전

▶ 제상 설정 기준:
• 제상 주기: 하루 2~4회 (환경에 따라)
• 제상 시간: 20~40분
• 제상 종료 온도: +10~+15°C (코일 온도)

▶ 현장 체크:
냉각 불량의 60%는 착상 문제
제상 히터 단선, 제상 타이머 오작동 자주 발생`,
    content_en: `Frost buildup is one of the top causes of refrigeration system failure.

▶ What is frost buildup?
Frost (ice) accumulating on the evaporator coil
• Moisture in the air freezes onto the sub-zero coil
• Severe frost blocks airflow → inadequate cooling

▶ Defrost methods:

① Natural defrost
  Compressor stops and thaws at room temperature
  Small refrigerators, takes a long time

② Electric heater defrost
  Heater installed on evaporator coil
  Most common, cycle controlled by timer

③ Hot gas defrost
  Compressor discharge gas heats the coil
  Fast and efficient, used in large systems

④ Reverse cycle defrost (heat pump heating)
  Reverses the refrigeration cycle

▶ Defrost setting guidelines:
• Defrost frequency: 2~4 times per day (depending on environment)
• Defrost duration: 20~40 minutes
• Defrost termination temperature: +10~+15°C (coil temperature)

▶ Field checks:
60% of inadequate cooling cases are frost buildup issues
Defrost heater burnout and defrost timer malfunction are frequent causes`,
    content_zh: `结霜是制冷系统故障的主要原因之一。

▶ 什么是结霜?
霜(冰)在蒸发器盘管上的积累
• 空气中水分附着在零下盘管上结冰
• 结霜严重 → 阻挡气流 → 制冷不良

▶ 除霜方式:

① 自然除霜
  压缩机停止后在室温下自然解冻
  小型冰箱,耗时长

② 电热除霜
  在蒸发器盘管上安装加热器
  最常见,通过定时器控制周期

③ 热气除霜
  用压缩机排气加热盘管
  快速高效,用于大型设备

④ 反向循环除霜 (热泵供暖)
  反转制冷循环

▶ 除霜设置标准:
• 除霜周期: 每日 2~4 次 (依环境)
• 除霜时间: 20~40 分钟
• 除霜终止温度: +10~+15°C (盘管温度)

▶ 现场检查:
制冷不良案例的 60% 是结霜问题
除霜加热器断线、定时器故障常发生`,
    content_ja: `冷凍機故障の主要原因の一つです。

▶ 着霜とは?
蒸発器コイルに霜(氷)が付着する現象
• 空気中の水分が氷点下のコイルに付着し凍結
• 着霜が酷くなると空気流れを遮断 → 冷却不良

▶ 除霜方式:

① 自然除霜
  圧縮機停止時に常温で自然解凍
  小型冷蔵庫、時間がかかる

② 電気ヒータ除霜
  蒸発器コイルにヒータ設置
  最も一般的、タイマで周期制御

③ ホットガス除霜
  圧縮機吐出ガスでコイル加熱
  高速・効率、大型設備で使用

④ 逆サイクル除霜 (エアコン暖房)
  冷凍サイクル反転

▶ 除霜設定基準:
• 除霜周期: 1日 2~4回 (環境による)
• 除霜時間: 20~40分
• 除霜終了温度: +10~+15°C (コイル温度)

▶ 現場チェック:
冷却不良の60%は着霜問題
除霜ヒータ断線、除霜タイマ誤作動が頻繁に発生`,
    content_es: `La acumulación de hielo es una de las principales causas de falla en sistemas de refrigeración.

▶ ¿Qué es la acumulación de hielo?
Hielo acumulándose en la bobina del evaporador
• La humedad del aire se congela sobre la bobina bajo cero
• Hielo severo bloquea el flujo de aire → enfriamiento inadecuado

▶ Métodos de desescarche:

① Desescarche natural
  El compresor se detiene y descongela a temperatura ambiente
  Refrigeradores pequeños, lleva mucho tiempo

② Desescarche por resistencia eléctrica
  Calentador instalado en la bobina del evaporador
  El más común, ciclo controlado por temporizador

③ Desescarche por gas caliente
  El gas de descarga del compresor calienta la bobina
  Rápido y eficiente, usado en sistemas grandes

④ Desescarche por ciclo invertido (calefacción por bomba de calor)
  Invierte el ciclo de refrigeración

▶ Pautas de configuración del desescarche:
• Frecuencia: 2~4 veces al día (según el ambiente)
• Duración: 20~40 minutos
• Temperatura de fin: +10~+15°C (temperatura de la bobina)

▶ Comprobaciones en campo:
60% de los casos de enfriamiento inadecuado son por acumulación de hielo
Resistencia de desescarche fundida y mal funcionamiento del temporizador son causas frecuentes`,
    content_hi: `रेफ्रिजरेशन सिस्टम failure के प्रमुख कारणों में से एक।

▶ Frost buildup क्या है?
Evaporator coil पर बर्फ का जमाव
• हवा की नमी sub-zero coil पर जमकर बर्फ बनती है
• गंभीर frost से airflow रुकता है → अपर्याप्त cooling

▶ Defrost विधियाँ:

① Natural defrost
  Compressor बंद होने पर room temperature पर पिघलना
  छोटे रेफ्रिजरेटर, लंबा समय

② Electric heater defrost
  Evaporator coil पर heater
  सबसे आम, timer से cycle control

③ Hot gas defrost
  Compressor discharge gas से coil गर्म
  तेज़ और कुशल, बड़े systems में

④ Reverse cycle defrost (heat pump heating)
  रेफ्रिजरेशन cycle उलटना

▶ Defrost setting guidelines:
• Defrost frequency: दिन में 2~4 बार (पर्यावरण अनुसार)
• Defrost duration: 20~40 मिनट
• Defrost termination temperature: +10~+15°C (coil temperature)

▶ Field checks:
अपर्याप्त cooling के 60% मामले frost buildup से
Defrost heater fuse, timer malfunction अक्सर होते हैं`,
    content_vi: `Là một trong những nguyên nhân hỏng hàng đầu của hệ thống lạnh.

▶ Đóng tuyết là gì?
Tuyết (băng) tích tụ trên cuộn dàn bay hơi
• Hơi ẩm trong không khí đóng băng trên cuộn lạnh
• Tuyết dày → chặn luồng khí → làm lạnh kém

▶ Phương pháp xả tuyết:

① Xả tuyết tự nhiên
  Máy nén dừng, tan ở nhiệt độ phòng
  Tủ lạnh nhỏ, mất thời gian

② Xả tuyết bằng heater điện
  Lắp heater lên cuộn dàn bay hơi
  Phổ biến nhất, điều khiển chu kỳ bằng timer

③ Xả tuyết bằng gas nóng
  Gas đẩy của máy nén làm nóng cuộn
  Nhanh và hiệu quả, dùng cho hệ lớn

④ Xả tuyết đảo chu trình (sưởi heat pump)
  Đảo chu trình lạnh

▶ Hướng dẫn cài đặt xả tuyết:
• Tần suất: 2~4 lần/ngày (tùy môi trường)
• Thời gian: 20~40 phút
• Nhiệt độ kết thúc: +10~+15°C (nhiệt độ cuộn)

▶ Kiểm tra hiện trường:
60% trường hợp lạnh kém do đóng tuyết
Đứt heater xả tuyết và lỗi timer rất hay gặp`,
    content_th: `เป็นหนึ่งในสาเหตุหลักที่ทำให้ระบบทำความเย็นเสีย

▶ การเกาะน้ำแข็งคืออะไร?
น้ำแข็งสะสมบนคอยล์อีวาปอเรเตอร์
• ความชื้นในอากาศเกาะบนคอยล์ที่อุณหภูมิต่ำกว่าศูนย์
• น้ำแข็งหนา → ขัดขวางการไหลของอากาศ → ทำความเย็นไม่พอ

▶ วิธีดีฟรอสต์:

① ดีฟรอสต์ตามธรรมชาติ
  หยุดคอมเพรสเซอร์ให้ละลายที่อุณหภูมิห้อง
  ตู้เย็นเล็ก ใช้เวลานาน

② ดีฟรอสต์ด้วยฮีตเตอร์ไฟฟ้า
  ติดฮีตเตอร์ที่คอยล์อีวาปอเรเตอร์
  พบมากที่สุด ควบคุมรอบด้วยไทเมอร์

③ ดีฟรอสต์ด้วยก๊าซร้อน
  ใช้ก๊าซจากด้านส่งของคอมเพรสเซอร์อุ่นคอยล์
  เร็วและมีประสิทธิภาพ ใช้ในระบบใหญ่

④ ดีฟรอสต์ด้วยการกลับวงจร (heat pump heating)
  กลับวงจรทำความเย็น

▶ แนวทางตั้งค่าดีฟรอสต์:
• ความถี่: 2~4 ครั้ง/วัน (ตามสภาพ)
• ระยะเวลา: 20~40 นาที
• อุณหภูมิสิ้นสุด: +10~+15°C (อุณหภูมิคอยล์)

▶ ตรวจในงานสนาม:
60% ของกรณีทำความเย็นไม่ดีเป็นเรื่องน้ำแข็งเกาะ
ฮีตเตอร์ดีฟรอสต์ขาด, ไทเมอร์ผิดปกติพบบ่อย`,
    content_id: `Salah satu penyebab kegagalan utama sistem refrigerasi.

▶ Apa itu penumpukan es?
Es menumpuk pada koil evaporator
• Uap air di udara membeku pada koil di bawah nol
• Es parah → menghalangi aliran udara → pendinginan kurang

▶ Metode defrost:

① Defrost alami
  Kompresor berhenti dan mencair di suhu ruangan
  Kulkas kecil, butuh waktu lama

② Defrost dengan heater listrik
  Heater dipasang pada koil evaporator
  Paling umum, siklus dikontrol timer

③ Defrost gas panas
  Gas discharge kompresor memanaskan koil
  Cepat dan efisien, untuk sistem besar

④ Defrost siklus terbalik (heat pump heating)
  Membalik siklus refrigerasi

▶ Panduan setting defrost:
• Frekuensi: 2~4 kali/hari (tergantung lingkungan)
• Durasi: 20~40 menit
• Suhu terminasi: +10~+15°C (suhu koil)

▶ Pemeriksaan lapangan:
60% kasus pendinginan kurang adalah masalah penumpukan es
Heater defrost putus, timer rusak sering terjadi`,
    content_ar: `أحد أبرز أسباب أعطال أنظمة التبريد.

▶ ما هو تكوّن الصقيع؟
تراكم الصقيع (الجليد) على ملف المبخر
• تتجمد رطوبة الهواء على الملف تحت الصفر
• الصقيع الكثيف يعيق تدفق الهواء → تبريد غير كافٍ

▶ طرق إزالة الجليد:

① إزالة طبيعية
  يتوقف الضاغط ويذوب في درجة حرارة الغرفة
  ثلاجات صغيرة، يستغرق وقتاً

② إزالة بسخان كهربائي
  سخان مركّب على ملف المبخر
  الأكثر شيوعاً، الدورة محكومة بمؤقت

③ إزالة بالغاز الساخن
  غاز تصريف الضاغط يسخّن الملف
  سريع وفعّال، يُستخدم في الأنظمة الكبيرة

④ إزالة بعكس الدورة (تدفئة المضخة الحرارية)
  عكس دورة التبريد

▶ إرشادات ضبط إزالة الجليد:
• التكرار: 2~4 مرات/يوم (حسب البيئة)
• المدة: 20~40 دقيقة
• حرارة الإنهاء: +10~+15°م (حرارة الملف)

▶ فحص ميداني:
60% من حالات ضعف التبريد سببها تكوّن الصقيع
انقطاع سخان إزالة الجليد وعطل المؤقت من الأسباب الشائعة`,
  },
  {
    id: 'electric_control',
    title: '전기/제어 기초',
    title_en: 'Electrical and Control Basics',
    title_zh: '电气/控制基础',
    title_ja: '電気/制御の基礎',
    title_es: 'Fundamentos eléctricos y de control',
    title_hi: 'इलेक्ट्रिकल और कंट्रोल मूल बातें',
    title_vi: 'Cơ bản điện và điều khiển',
    title_th: 'พื้นฐานไฟฟ้าและระบบควบคุม',
    title_id: 'Dasar listrik dan kontrol',
    title_ar: 'أساسيات الكهرباء والتحكم',
    icon: '⚡',
    content: `냉동기 전기 제어의 핵심 부품들입니다.

▶ 온도 조절기 (Temperature Controller)
  설정 온도 도달 시 압축기 ON/OFF
  • 기계식: 감온통 방식, 단순하고 내구성 좋음
  • 디지털: 정밀 제어, 알람 기능
  • 현장 체크: 센서 위치, 설정값 확인

▶ 압력 스위치 (Pressure Switch)
  고압/저압 이상 시 압축기 보호 차단

  고압 스위치 (HPS)
  • 설정압 초과 시 차단
  • 수동 복귀형 많음 — 원인 해결 후 리셋 필요
  • 주 원인: 응축기 막힘, 과충전

  저압 스위치 (LPS)
  • 설정압 미만 시 차단
  • 자동 복귀형 많음
  • 주 원인: 냉매 부족, 증발기 착상

▶ 과부하 계전기 (Overload Relay)
  압축기 모터 과전류 보호
  • 트립 시 원인 제거 후 수동 복귀

▶ 4방 밸브 (4-way Valve, 에어컨)
  냉방↔난방 전환
  코일 찍히면 냉방/난방 안 됨

▶ 현장 팁:
제어 계통은 멀티미터 필수
→ 전압, 전류, 도통 체크 순서로`,
    content_en: `Key electrical control components in refrigeration systems.

▶ Temperature Controller
  Turns compressor ON/OFF when setpoint is reached
  • Mechanical type: Sensing bulb method, simple and durable
  • Digital type: Precise control, alarm functions
  • Field check: Verify sensor location and setpoint values

▶ Pressure Switch
  Protects compressor by cutting out on abnormal high/low pressure

  High Pressure Switch (HPS)
  • Cuts out when pressure exceeds setpoint
  • Many are manual reset type — must reset after resolving root cause
  • Common causes: Blocked condenser, refrigerant overcharge

  Low Pressure Switch (LPS)
  • Cuts out when pressure drops below setpoint
  • Many are automatic reset type
  • Common causes: Low refrigerant charge, evaporator frost buildup

▶ Overload Relay
  Protects compressor motor from overcurrent
  • Manual reset after removing the cause of trip

▶ 4-Way Valve (air conditioners)
  Switches between cooling and heating modes
  If coil is stuck, cooling/heating will not work

▶ Field tip:
A multimeter is essential for electrical troubleshooting
→ Check voltage, current, and continuity in that order`,
    content_zh: `制冷系统电气控制的关键部件。

▶ 温度控制器 (Temperature Controller)
  达到设定温度时让压缩机 ON/OFF
  • 机械式: 感温筒方式,简单耐用
  • 数字式: 精密控制,有报警功能
  • 现场检查: 核对传感器位置和设定值

▶ 压力开关 (Pressure Switch)
  压力异常时切断压缩机以保护

  高压开关 (HPS)
  • 超过设定压力时切断
  • 多为手动复位 — 解决原因后再复位
  • 常见原因: 冷凝器堵塞、过充

  低压开关 (LPS)
  • 低于设定压力时切断
  • 多为自动复位
  • 常见原因: 制冷剂不足、蒸发器结霜

▶ 过载继电器 (Overload Relay)
  保护压缩机电机过流
  • 跳闸后清除原因再手动复位

▶ 四通阀 (4-Way Valve, 空调)
  切换制冷↔制热
  线圈卡住则无法切换

▶ 现场提示:
电气系统检查必备万用表
→ 按 电压 → 电流 → 通断 顺序检查`,
    content_ja: `冷凍機電気制御の主要部品です。

▶ 温度調節器 (Temperature Controller)
  設定温度到達時に圧縮機ON/OFF
  • 機械式: 感温筒方式、シンプルで耐久性良
  • デジタル: 精密制御、アラーム機能
  • 現場チェック: センサー位置、設定値確認

▶ 圧力スイッチ (Pressure Switch)
  高圧/低圧異常時に圧縮機保護遮断

  高圧スイッチ (HPS)
  • 設定圧超過時に遮断
  • 手動復帰型多い — 原因解決後リセット必要
  • 主原因: 凝縮器詰まり、過充填

  低圧スイッチ (LPS)
  • 設定圧未満時に遮断
  • 自動復帰型多い
  • 主原因: 冷媒不足、蒸発器着霜

▶ 過負荷リレー (Overload Relay)
  圧縮機モータ過電流保護
  • トリップ時は原因除去後手動復帰

▶ 四方弁 (4-Way Valve, エアコン)
  冷房↔暖房切替
  コイル固着で切替不可

▶ 現場のコツ:
制御系統はマルチメータ必須
→ 電圧 → 電流 → 導通 の順でチェック`,
    content_es: `Componentes eléctricos clave en sistemas de refrigeración.

▶ Termostato (Temperature Controller)
  Enciende/apaga el compresor al alcanzar el setpoint
  • Mecánico: Bulbo sensor, simple y duradero
  • Digital: Control preciso, funciones de alarma
  • Campo: Verificar posición del sensor y valores de ajuste

▶ Presostato (Pressure Switch)
  Protege el compresor cortando en alta/baja presión anormal

  Presostato de alta (HPS)
  • Corta al exceder el setpoint
  • Muchos son de rearme manual — resetear tras resolver la causa
  • Causas comunes: Condensador obstruido, sobrecarga de refrigerante

  Presostato de baja (LPS)
  • Corta al caer bajo el setpoint
  • Muchos son de rearme automático
  • Causas comunes: Carga baja de refrigerante, hielo en evaporador

▶ Relé de sobrecarga (Overload Relay)
  Protege el motor del compresor contra sobrecorriente
  • Rearme manual tras eliminar la causa

▶ Válvula de 4 vías (4-Way Valve, AC)
  Cambia entre modo frío y calor
  Si la bobina queda atorada, no funciona

▶ Consejo de campo:
Multímetro indispensable para troubleshooting eléctrico
→ Revisar en orden: voltaje, corriente, continuidad`,
    content_hi: `रेफ्रिजरेशन सिस्टम के प्रमुख electrical control components।

▶ Temperature Controller (तापमान नियंत्रक)
  Setpoint तक पहुँचने पर compressor को ON/OFF करता है
  • Mechanical: Sensing bulb, सरल और टिकाऊ
  • Digital: Precise control, alarm functions
  • Field check: Sensor की स्थिति और setpoint जाँचें

▶ Pressure Switch
  असामान्य high/low pressure पर compressor को बंद कर सुरक्षा देता है

  High Pressure Switch (HPS)
  • Setpoint से अधिक होने पर cut out
  • Manual reset अधिक — कारण हल करने के बाद reset
  • सामान्य कारण: Condenser block, overcharge

  Low Pressure Switch (LPS)
  • Setpoint से कम होने पर cut out
  • Auto reset अधिक
  • सामान्य कारण: रेफ्रिजरेंट कम, evaporator frost

▶ Overload Relay
  Compressor motor को overcurrent से बचाता है
  • Trip पर कारण हटाकर manual reset

▶ 4-Way Valve (एयर कंडीशनर)
  Cooling↔Heating switching
  Coil stuck होने पर cooling/heating नहीं

▶ फील्ड टिप:
Electrical system के लिए multimeter ज़रूरी
→ Voltage → current → continuity क्रम में check`,
    content_vi: `Các thành phần điều khiển điện chính trong hệ thống lạnh.

▶ Bộ điều khiển nhiệt độ (Temperature Controller)
  Bật/tắt máy nén khi đạt setpoint
  • Cơ học: dùng bầu cảm biến, đơn giản, bền
  • Kỹ thuật số: điều khiển chính xác, có cảnh báo
  • Kiểm tra hiện trường: vị trí cảm biến, giá trị cài đặt

▶ Công tắc áp suất (Pressure Switch)
  Ngắt máy nén khi áp cao/thấp bất thường để bảo vệ

  Công tắc áp cao (HPS)
  • Ngắt khi vượt áp đặt
  • Đa số reset tay — sau khi xử lý nguyên nhân
  • Nguyên nhân thường gặp: Tắc dàn ngưng, nạp dư

  Công tắc áp thấp (LPS)
  • Ngắt khi áp thấp dưới mức đặt
  • Đa số reset tự động
  • Nguyên nhân thường gặp: Thiếu gas, đóng tuyết dàn bay hơi

▶ Rơ-le quá tải (Overload Relay)
  Bảo vệ động cơ máy nén khỏi quá dòng
  • Trip thì xử lý nguyên nhân rồi reset tay

▶ Van 4 ngả (4-Way Valve, điều hòa)
  Chuyển giữa lạnh/sưởi
  Cuộn kẹt thì không chuyển được

▶ Mẹo hiện trường:
Đồng hồ vạn năng (multimeter) là bắt buộc
→ Kiểm tra theo thứ tự: điện áp → dòng → thông mạch`,
    content_th: `อุปกรณ์ควบคุมไฟฟ้าหลักในระบบทำความเย็น

▶ ตัวควบคุมอุณหภูมิ (Temperature Controller)
  เปิด/ปิดคอมเพรสเซอร์เมื่อถึงค่าที่ตั้ง
  • แบบกลไก: ใช้กระเปาะ, เรียบง่าย ทนทาน
  • แบบดิจิทัล: ควบคุมแม่นยำ, มีฟังก์ชันแจ้งเตือน
  • ตรวจในงานสนาม: ตำแหน่งเซ็นเซอร์, ค่าที่ตั้ง

▶ สวิตช์ความดัน (Pressure Switch)
  ตัดคอมเพรสเซอร์เมื่อแรงดันสูง/ต่ำผิดปกติเพื่อป้องกัน

  สวิตช์แรงดันสูง (HPS)
  • ตัดเมื่อเกินค่าที่ตั้ง
  • ส่วนใหญ่รีเซ็ตด้วยมือ — แก้สาเหตุแล้วจึงรีเซ็ต
  • สาเหตุพบบ่อย: คอนเดนเซอร์อุดตัน, เติมเกิน

  สวิตช์แรงดันต่ำ (LPS)
  • ตัดเมื่อต่ำกว่าค่าที่ตั้ง
  • ส่วนใหญ่รีเซ็ตอัตโนมัติ
  • สาเหตุพบบ่อย: น้ำยาน้อย, อีวาปอเรเตอร์เกาะน้ำแข็ง

▶ รีเลย์โอเวอร์โหลด (Overload Relay)
  ปกป้องมอเตอร์คอมเพรสเซอร์จากกระแสเกิน
  • ทริปแล้วต้องแก้สาเหตุก่อนรีเซ็ตด้วยมือ

▶ วาล์ว 4 ทาง (4-Way Valve, แอร์)
  สลับโหมดเย็น↔ร้อน
  หากคอยล์ติด ก็ไม่สลับโหมดได้

▶ เคล็ดลับงานสนาม:
ระบบควบคุมต้องใช้มัลติมิเตอร์
→ ตรวจตามลำดับ: แรงดัน → กระแส → ความต่อเนื่อง`,
    content_id: `Komponen utama kontrol listrik pada sistem refrigerasi.

▶ Pengontrol Suhu (Temperature Controller)
  Menghidup/matikan kompresor saat setpoint tercapai
  • Mekanik: metode sensing bulb, sederhana dan tahan lama
  • Digital: kontrol presisi, fungsi alarm
  • Cek lapangan: posisi sensor, nilai setpoint

▶ Switch Tekanan (Pressure Switch)
  Melindungi kompresor dengan memutus saat tekanan tinggi/rendah abnormal

  Switch Tekanan Tinggi (HPS)
  • Memutus saat melebihi setpoint
  • Banyak tipe reset manual — reset setelah penyebab diatasi
  • Penyebab umum: Kondensor tersumbat, pengisian berlebih

  Switch Tekanan Rendah (LPS)
  • Memutus saat di bawah setpoint
  • Banyak tipe reset otomatis
  • Penyebab umum: Refrigeran kurang, evaporator membeku

▶ Overload Relay
  Melindungi motor kompresor dari arus berlebih
  • Reset manual setelah penyebab diatasi

▶ 4-Way Valve (AC)
  Mengganti mode pendinginan↔pemanasan
  Jika kumparan macet, tidak bisa ganti mode

▶ Tip lapangan:
Multimeter wajib untuk troubleshooting listrik
→ Cek berurutan: tegangan → arus → kontinuitas`,
    content_ar: `مكونات التحكم الكهربائي الرئيسية في أنظمة التبريد.

▶ منظم الحرارة (Temperature Controller)
  يشغّل/يوقف الضاغط عند الوصول لقيمة الضبط
  • ميكانيكي: بطريقة اللمبة الحساسة، بسيط ومتين
  • رقمي: تحكم دقيق، وظائف إنذار
  • فحص ميداني: التحقق من موقع الحساس وقيم الضبط

▶ مفتاح الضغط (Pressure Switch)
  يحمي الضاغط بالفصل عند ضغط عالٍ/منخفض غير طبيعي

  مفتاح الضغط العالي (HPS)
  • يفصل عند تجاوز قيمة الضبط
  • أغلبه إعادة ضبط يدوية — إعادة الضبط بعد حل السبب
  • أسباب شائعة: انسداد المكثف، شحن زائد

  مفتاح الضغط المنخفض (LPS)
  • يفصل عند الانخفاض دون قيمة الضبط
  • أغلبه إعادة ضبط تلقائية
  • أسباب شائعة: نقص الفريون، تجمد المبخر

▶ مرحل الحمل الزائد (Overload Relay)
  يحمي محرك الضاغط من التيار الزائد
  • إعادة ضبط يدوية بعد إزالة سبب الفصل

▶ صمام رباعي الاتجاه (4-Way Valve، للمكيفات)
  يبدل بين التبريد والتسخين
  إذا علق الملف، لا يعمل التبديل

▶ نصيحة ميدانية:
المالتيميتر ضروري لتشخيص الكهرباء
→ افحص بالترتيب: الجهد → التيار → الاستمرارية`,
  },
  {
    id: 'common_failures',
    title: '주요 고장 패턴',
    title_en: 'Common Failure Patterns',
    title_zh: '常见故障模式',
    title_ja: '主な故障パターン',
    title_es: 'Patrones de fallas comunes',
    title_hi: 'सामान्य failure पैटर्न',
    title_vi: 'Các kiểu hỏng thường gặp',
    title_th: 'รูปแบบความเสียหายที่พบบ่อย',
    title_id: 'Pola kegagalan umum',
    title_ar: 'أنماط الأعطال الشائعة',
    icon: '🔍',
    content: `현장에서 자주 만나는 고장 유형입니다.

▶ 냉각 불량
원인 ①: 냉매 부족 → 저압 낮음, 과열도 높음
원인 ②: 응축기 오염 → 고압 높음, 팬 확인
원인 ③: 증발기 착상 → 결빙, 풍량 저하
원인 ④: 팽창밸브 막힘 → 저압 낮음, 착빙

▶ 압축기 안 돌아감
원인 ①: 전원 문제 → 전압 체크
원인 ②: 고압/저압 스위치 트립 → 압력 확인
원인 ③: 과부하 계전기 트립 → 전류 체크
원인 ④: 압축기 소착 → 기동 불가, 교체

▶ 고압 상승
원인 ①: 응축기 핀 코일 오염
원인 ②: 응축 팬 불량
원인 ③: 냉매 과충전
원인 ④: 불응축 가스 혼입

▶ 저압 저하
원인 ①: 냉매 누설/부족
원인 ②: 증발기 착상 심함
원인 ③: 팽창밸브 막힘/닫힘
원인 ④: 흡입 배관 막힘

▶ 소음/진동
원인 ①: 팬 블레이드 이물질
원인 ②: 압축기 마운트 파손
원인 ③: 배관 진동 (클램프 이완)
원인 ④: 액압축 (냉매 과충전, 오일 복귀 불량)`,
    content_en: `Common failure types encountered in the field.

▶ Inadequate Cooling
Cause ①: Low refrigerant charge → low suction pressure, high superheat
Cause ②: Dirty condenser → high discharge pressure, check fan
Cause ③: Evaporator frost buildup → icing, reduced airflow
Cause ④: Blocked expansion valve → low suction pressure, frost at valve

▶ Compressor Won't Start
Cause ①: Power supply issue → check voltage
Cause ②: High/low pressure switch trip → check pressures
Cause ③: Overload relay trip → check current
Cause ④: Compressor seizure → fails to start, replacement required

▶ High Discharge Pressure
Cause ①: Dirty condenser fin coil
Cause ②: Condenser fan failure
Cause ③: Refrigerant overcharge
Cause ④: Non-condensable gas contamination

▶ Low Suction Pressure
Cause ①: Refrigerant leak / low charge
Cause ②: Severe evaporator frost buildup
Cause ③: Blocked or closed expansion valve
Cause ④: Blocked suction line

▶ Noise / Vibration
Cause ①: Foreign object in fan blade
Cause ②: Broken compressor mounting (anti-vibration mount)
Cause ③: Pipe vibration (loose clamps)
Cause ④: Liquid slugging (refrigerant overcharge, poor oil return)`,
    content_zh: `现场常见的故障类型。

▶ 制冷不良
原因 ①: 制冷剂不足 → 低压低、过热度高
原因 ②: 冷凝器脏污 → 高压高,检查风扇
原因 ③: 蒸发器结霜 → 结冰,风量下降
原因 ④: 膨胀阀堵塞 → 低压低,阀处结霜

▶ 压缩机不启动
原因 ①: 电源问题 → 检查电压
原因 ②: 高/低压开关跳闸 → 检查压力
原因 ③: 过载继电器跳闸 → 检查电流
原因 ④: 压缩机咬死 → 不启动,需更换

▶ 高压上升
原因 ①: 冷凝器翅片盘管脏污
原因 ②: 冷凝风扇故障
原因 ③: 制冷剂过充
原因 ④: 不凝气体混入

▶ 低压下降
原因 ①: 制冷剂泄漏/不足
原因 ②: 蒸发器严重结霜
原因 ③: 膨胀阀堵塞/关闭
原因 ④: 吸气管路堵塞

▶ 噪音/振动
原因 ①: 风扇叶片有异物
原因 ②: 压缩机减振垫损坏
原因 ③: 管路振动 (卡子松动)
原因 ④: 液击 (过充, 油回流不良)`,
    content_ja: `現場でよく見られる故障パターンです。

▶ 冷却不良
原因 ①: 冷媒不足 → 低圧低い、過熱度高い
原因 ②: 凝縮器汚れ → 高圧高い、ファン確認
原因 ③: 蒸発器着霜 → 結氷、風量低下
原因 ④: 膨張弁詰まり → 低圧低い、弁周りに着霜

▶ 圧縮機が起動しない
原因 ①: 電源問題 → 電圧チェック
原因 ②: 高圧/低圧スイッチトリップ → 圧力確認
原因 ③: 過負荷リレートリップ → 電流チェック
原因 ④: 圧縮機焼付き → 起動不可、交換

▶ 高圧上昇
原因 ①: 凝縮器フィンコイル汚れ
原因 ②: 凝縮ファン不良
原因 ③: 冷媒過充填
原因 ④: 不凝縮ガス混入

▶ 低圧低下
原因 ①: 冷媒漏れ/不足
原因 ②: 蒸発器の着霜が酷い
原因 ③: 膨張弁詰まり/閉止
原因 ④: 吸入配管詰まり

▶ 騒音/振動
原因 ①: ファンブレードに異物
原因 ②: 圧縮機マウント破損
原因 ③: 配管振動 (クランプ緩み)
原因 ④: 液圧縮 (冷媒過充填、オイル戻り不良)`,
    content_es: `Tipos de falla comunes en el campo.

▶ Enfriamiento insuficiente
Causa ①: Carga baja de refrigerante → baja presión de succión, alto sobrecalentamiento
Causa ②: Condensador sucio → alta presión, revisar ventilador
Causa ③: Hielo en evaporador → congelación, bajo flujo de aire
Causa ④: Válvula de expansión bloqueada → baja presión, hielo en la válvula

▶ Compresor no arranca
Causa ①: Problema de alimentación → revisar voltaje
Causa ②: Disparo de presostato alto/bajo → revisar presiones
Causa ③: Disparo del relé de sobrecarga → revisar corriente
Causa ④: Agarrotamiento del compresor → no arranca, requiere reemplazo

▶ Presión de descarga alta
Causa ①: Aletas del condensador sucias
Causa ②: Falla del ventilador del condensador
Causa ③: Sobrecarga de refrigerante
Causa ④: Contaminación con gas no condensable

▶ Presión de succión baja
Causa ①: Fuga / carga baja de refrigerante
Causa ②: Hielo severo en evaporador
Causa ③: Válvula de expansión bloqueada o cerrada
Causa ④: Línea de succión obstruida

▶ Ruido / Vibración
Causa ①: Objeto extraño en el aspa del ventilador
Causa ②: Soporte antivibración del compresor roto
Causa ③: Vibración de tuberías (abrazaderas flojas)
Causa ④: Golpe de líquido (sobrecarga de refrigerante, mal retorno de aceite)`,
    content_hi: `फील्ड में अक्सर मिलने वाले failure प्रकार।

▶ अपर्याप्त Cooling
कारण ①: रेफ्रिजरेंट कम → suction pressure कम, superheat ज़्यादा
कारण ②: Condenser गंदा → discharge pressure ज़्यादा, fan देखें
कारण ③: Evaporator पर frost → बर्फ़ जमना, airflow कम
कारण ④: Expansion valve block → suction कम, valve पर frost

▶ Compressor start नहीं होता
कारण ①: Power समस्या → voltage जाँचें
कारण ②: High/low pressure switch trip → दबाव जाँचें
कारण ③: Overload relay trip → current जाँचें
कारण ④: Compressor seizure → start नहीं होता, बदलना ज़रूरी

▶ High Discharge Pressure
कारण ①: Condenser fin coil गंदा
कारण ②: Condenser fan failure
कारण ③: रेफ्रिजरेंट overcharge
कारण ④: Non-condensable gas का मिश्रण

▶ Low Suction Pressure
कारण ①: रेफ्रिजरेंट leak / कम
कारण ②: Evaporator पर भारी frost
कारण ③: Expansion valve block / बंद
कारण ④: Suction line block

▶ Noise / Vibration
कारण ①: Fan blade में foreign object
कारण ②: Compressor mounting (anti-vibration mount) टूटा
कारण ③: Pipe vibration (clamps ढीले)
कारण ④: Liquid slugging (overcharge, oil return खराब)`,
    content_vi: `Các kiểu hỏng thường gặp tại hiện trường.

▶ Lạnh kém
Nguyên nhân ①: Thiếu gas → áp hút thấp, quá nhiệt cao
Nguyên nhân ②: Dàn ngưng bẩn → áp đẩy cao, kiểm tra quạt
Nguyên nhân ③: Đóng tuyết dàn bay hơi → đóng băng, lưu lượng gió giảm
Nguyên nhân ④: Tắc van tiết lưu → áp hút thấp, đóng tuyết tại van

▶ Máy nén không khởi động
Nguyên nhân ①: Sự cố nguồn → kiểm tra điện áp
Nguyên nhân ②: Trip công tắc áp cao/thấp → kiểm tra áp
Nguyên nhân ③: Trip rơ-le quá tải → kiểm tra dòng
Nguyên nhân ④: Kẹt máy nén → không khởi động, cần thay

▶ Áp đẩy cao
Nguyên nhân ①: Cánh tản nhiệt dàn ngưng bẩn
Nguyên nhân ②: Hỏng quạt dàn ngưng
Nguyên nhân ③: Nạp dư gas
Nguyên nhân ④: Lẫn khí không ngưng

▶ Áp hút thấp
Nguyên nhân ①: Rò gas / thiếu gas
Nguyên nhân ②: Đóng tuyết nhiều ở dàn bay hơi
Nguyên nhân ③: Van tiết lưu tắc/đóng
Nguyên nhân ④: Tắc đường hút

▶ Tiếng ồn / Rung
Nguyên nhân ①: Dị vật ở cánh quạt
Nguyên nhân ②: Hỏng đệm chống rung máy nén
Nguyên nhân ③: Đường ống rung (kẹp lỏng)
Nguyên nhân ④: Liquid slug (nạp dư gas, hồi dầu kém)`,
    content_th: `ประเภทความเสียหายที่พบบ่อยในงานสนาม

▶ ทำความเย็นไม่ดี
สาเหตุ ①: น้ำยาน้อย → แรงดันด้านดูดต่ำ, ซูเปอร์ฮีตสูง
สาเหตุ ②: คอนเดนเซอร์สกปรก → แรงดันด้านส่งสูง, ตรวจพัดลม
สาเหตุ ③: อีวาปอเรเตอร์เกาะน้ำแข็ง → แข็งตัว, ลมเบา
สาเหตุ ④: วาล์วลดความดันอุดตัน → แรงดันด้านดูดต่ำ, น้ำแข็งที่วาล์ว

▶ คอมเพรสเซอร์ไม่สตาร์ท
สาเหตุ ①: ปัญหาระบบไฟ → ตรวจแรงดัน
สาเหตุ ②: สวิตช์แรงดันสูง/ต่ำทริป → ตรวจแรงดัน
สาเหตุ ③: รีเลย์โอเวอร์โหลดทริป → ตรวจกระแส
สาเหตุ ④: คอมเพรสเซอร์ติด → สตาร์ทไม่ได้, ต้องเปลี่ยน

▶ แรงดันสูงเพิ่ม
สาเหตุ ①: ครีบคอยล์คอนเดนเซอร์สกปรก
สาเหตุ ②: พัดลมคอนเดนเซอร์เสีย
สาเหตุ ③: เติมน้ำยาเกิน
สาเหตุ ④: ก๊าซที่ไม่ควบแน่นปนเข้า

▶ แรงดันต่ำลด
สาเหตุ ①: น้ำยารั่ว/น้อย
สาเหตุ ②: อีวาปอเรเตอร์เกาะน้ำแข็งหนัก
สาเหตุ ③: วาล์วลดความดันอุดตัน/ปิด
สาเหตุ ④: ท่อด้านดูดอุดตัน

▶ เสียง/การสั่น
สาเหตุ ①: ใบพัดมีสิ่งแปลกปลอม
สาเหตุ ②: แท่นยึดคอมเพรสเซอร์เสียหาย
สาเหตุ ③: ท่อสั่น (คลิปหลวม)
สาเหตุ ④: Liquid slugging (เติมเกิน, การคืนน้ำมันไม่ดี)`,
    content_id: `Tipe kegagalan yang umum di lapangan.

▶ Pendinginan kurang
Penyebab ①: Refrigeran kurang → tekanan hisap rendah, superheat tinggi
Penyebab ②: Kondensor kotor → tekanan tinggi, periksa kipas
Penyebab ③: Es menumpuk di evaporator → membeku, aliran udara turun
Penyebab ④: Katup ekspansi tersumbat → tekanan hisap rendah, es di katup

▶ Kompresor tidak start
Penyebab ①: Masalah daya → cek tegangan
Penyebab ②: Switch tekanan tinggi/rendah trip → cek tekanan
Penyebab ③: Overload relay trip → cek arus
Penyebab ④: Kompresor macet → tidak bisa start, perlu ganti

▶ Tekanan discharge tinggi
Penyebab ①: Sirip koil kondensor kotor
Penyebab ②: Kipas kondensor rusak
Penyebab ③: Pengisian refrigeran berlebih
Penyebab ④: Gas non-kondensasi tercampur

▶ Tekanan hisap rendah
Penyebab ①: Kebocoran / refrigeran kurang
Penyebab ②: Es parah di evaporator
Penyebab ③: Katup ekspansi tersumbat/tertutup
Penyebab ④: Saluran hisap tersumbat

▶ Suara / Getaran
Penyebab ①: Benda asing di baling kipas
Penyebab ②: Mounting anti-getar kompresor rusak
Penyebab ③: Getaran pipa (klem kendor)
Penyebab ④: Liquid slugging (pengisian berlebih, oil return buruk)`,
    content_ar: `أنواع الأعطال الشائعة في الموقع.

▶ تبريد غير كافٍ
السبب ①: نقص الفريون → ضغط السحب منخفض، إحماء مرتفع
السبب ②: المكثف متسخ → ضغط التصريف مرتفع، افحص المروحة
السبب ③: تكوّن الصقيع في المبخر → تجمد، تدفق هواء منخفض
السبب ④: انسداد صمام التمدد → ضغط السحب منخفض، صقيع عند الصمام

▶ الضاغط لا يبدأ
السبب ①: مشكلة في الطاقة → افحص الجهد
السبب ②: تعشيق مفتاح الضغط العالي/المنخفض → افحص الضغط
السبب ③: تعشيق مرحل الحمل الزائد → افحص التيار
السبب ④: علوق الضاغط → لا يبدأ، يلزم استبداله

▶ ارتفاع ضغط التصريف
السبب ①: زعانف ملف المكثف متسخة
السبب ②: عطل مروحة المكثف
السبب ③: شحن زائد للفريون
السبب ④: اختلاط غاز غير قابل للتكثيف

▶ انخفاض ضغط السحب
السبب ①: تسرب / نقص الفريون
السبب ②: تكوّن صقيع شديد في المبخر
السبب ③: انسداد/إغلاق صمام التمدد
السبب ④: انسداد خط السحب

▶ ضوضاء / اهتزاز
السبب ①: جسم غريب في ريشة المروحة
السبب ②: تلف قاعدة الضاغط (المخمد)
السبب ③: اهتزاز الأنابيب (تخفّف الكلابات)
السبب ④: ضرب السائل (شحن زائد، سوء عودة الزيت)`,
  },
  {
    id: 'site_checklist',
    title: '현장 도착 후 점검 순서',
    title_en: 'On-Site Inspection Sequence',
    title_zh: '现场到达后检查顺序',
    title_ja: '現場到着後の点検順序',
    title_es: 'Secuencia de inspección en sitio',
    title_hi: 'साइट पर पहुँचने के बाद निरीक्षण क्रम',
    title_vi: 'Trình tự kiểm tra khi đến hiện trường',
    title_th: 'ลำดับการตรวจหลังถึงสถานที่งาน',
    title_id: 'Urutan inspeksi setelah tiba di lokasi',
    title_ar: 'تسلسل الفحص بعد الوصول للموقع',
    icon: '📋',
    content: `현장에서 체계적으로 점검하는 순서입니다.

① 고객 증상 청취
  • 언제부터? 갑자기/서서히?
  • 소리 났는지? 냄새 났는지?
  • 최근 변경사항 있는지?

② 외관 육안 점검
  • 전원 들어오는지 확인
  • 응축기/증발기 오염 상태
  • 오일/냉매 누설 흔적 (기름때)
  • 배선 이상 여부

③ 운전 상태 확인
  • 압축기 기동 여부
  • 고압/저압 게이지 확인
  • 운전 전류 측정
  • 팬 작동 여부

④ 온도 측정
  • 흡입 배관 온도
  • 토출 배관 온도
  • 응축기 입구/출구
  • 실내 온도

⑤ 과열도/과냉도 계산
  • 정상 범위인지 확인

⑥ 원인 진단 및 조치
  • 가장 가능성 높은 원인부터
  • 최소 수정으로 해결 시도

⑦ 수리 후 확인
  • 설정 온도까지 도달 확인
  • 운전 전류 재확인
  • 고객에게 설명`,
    content_en: `A systematic inspection sequence for field service calls.

① Listen to customer's complaint
  • When did it start? Sudden or gradual?
  • Any unusual sounds or odors?
  • Any recent changes to the system?

② Visual external inspection
  • Confirm power is on
  • Condenser/evaporator contamination status
  • Oil/refrigerant leak traces (oil stains)
  • Wiring abnormalities

③ Check operating conditions
  • Compressor starting/running
  • High/low pressure gauge readings
  • Running current measurement
  • Fan operation check

④ Temperature measurements
  • Suction line temperature
  • Discharge line temperature
  • Condenser inlet/outlet
  • Room/cabinet temperature

⑤ Calculate superheat/subcooling
  • Confirm values are within normal range

⑥ Diagnose and take action
  • Start with the most likely cause
  • Attempt repair with minimum intervention

⑦ Post-repair verification
  • Confirm temperature reaches setpoint
  • Recheck running current
  • Explain results to customer`,
    content_zh: `现场系统化检查的标准顺序。

① 听取客户陈述
  • 什么时候开始的? 突然还是渐进?
  • 是否有声音/气味?
  • 最近有变化吗?

② 外观目视检查
  • 确认电源
  • 冷凝器/蒸发器污染状态
  • 油/制冷剂泄漏痕迹 (油渍)
  • 接线异常

③ 运行状态确认
  • 压缩机是否启动
  • 高/低压表读数
  • 运行电流测量
  • 风扇运行检查

④ 温度测量
  • 吸气管温度
  • 排气管温度
  • 冷凝器入口/出口
  • 室温/库内温度

⑤ 计算过热度/过冷度
  • 确认是否在正常范围

⑥ 诊断并处理
  • 从可能性最高的原因开始
  • 以最小修改尝试修复

⑦ 维修后确认
  • 温度是否达到设定值
  • 再次检查运行电流
  • 向客户说明`,
    content_ja: `現場で体系的に点検する順序です。

① 顧客の症状を聞く
  • いつから? 急に/徐々に?
  • 音はしたか? 臭いはしたか?
  • 最近の変更点はあるか?

② 外観目視点検
  • 電源が入るか確認
  • 凝縮器/蒸発器の汚れ状態
  • オイル/冷媒漏れの痕跡 (油汚れ)
  • 配線異常の有無

③ 運転状態確認
  • 圧縮機の起動可否
  • 高圧/低圧ゲージ確認
  • 運転電流測定
  • ファン作動確認

④ 温度測定
  • 吸入配管温度
  • 吐出配管温度
  • 凝縮器入口/出口
  • 室内温度

⑤ 過熱度/過冷却度の計算
  • 正常範囲内か確認

⑥ 原因診断および対応
  • 可能性の高い原因から
  • 最小修正で解決を試みる

⑦ 修理後の確認
  • 設定温度まで到達確認
  • 運転電流再確認
  • 顧客への説明`,
    content_es: `Secuencia sistemática de inspección para llamadas de servicio en campo.

① Escuchar la queja del cliente
  • ¿Cuándo empezó? ¿Súbito o gradual?
  • ¿Hubo sonidos u olores extraños?
  • ¿Cambios recientes en el sistema?

② Inspección visual externa
  • Confirmar que hay alimentación
  • Estado de suciedad del condensador/evaporador
  • Trazas de fuga de aceite/refrigerante (manchas)
  • Anomalías en cableado

③ Verificar condiciones de operación
  • Arranque/marcha del compresor
  • Lecturas de manómetros alta/baja
  • Medición de corriente
  • Operación del ventilador

④ Mediciones de temperatura
  • Temperatura línea de succión
  • Temperatura línea de descarga
  • Entrada/salida del condensador
  • Temperatura de sala/cabinet

⑤ Calcular sobrecalentamiento/subenfriamiento
  • Confirmar que están en rango normal

⑥ Diagnosticar y actuar
  • Empezar por la causa más probable
  • Intentar reparación con mínima intervención

⑦ Verificación post-reparación
  • Confirmar que la temperatura llega al setpoint
  • Volver a verificar corriente
  • Explicar al cliente`,
    content_hi: `Field service calls के लिए systematic inspection क्रम।

① ग्राहक की शिकायत सुनें
  • कब से शुरू हुआ? अचानक/धीरे-धीरे?
  • कोई आवाज़/गंध?
  • हाल में कोई बदलाव?

② बाहरी visual निरीक्षण
  • Power on है पुष्टि करें
  • Condenser/evaporator की गंदगी
  • Oil/रेफ्रिजरेंट leak के निशान (तेल के दाग)
  • Wiring में असामान्यता

③ Operating conditions जाँच
  • Compressor start/running
  • High/low pressure gauge reading
  • Running current measurement
  • Fan operation जाँच

④ तापमान माप
  • Suction line तापमान
  • Discharge line तापमान
  • Condenser इनलेट/आउटलेट
  • कमरे/cabinet तापमान

⑤ Superheat/Subcooling गणना
  • सामान्य रेंज में हैं पुष्टि

⑥ Diagnose और कार्रवाई
  • सबसे संभावित कारण से शुरू
  • न्यूनतम हस्तक्षेप से repair का प्रयास

⑦ Repair के बाद verification
  • Setpoint तक तापमान पहुँचा पुष्टि
  • Running current फिर से जाँच
  • ग्राहक को समझाएँ`,
    content_vi: `Trình tự kiểm tra hệ thống tại hiện trường.

① Nghe phản ánh của khách
  • Bắt đầu khi nào? Đột ngột/dần dần?
  • Có tiếng/mùi lạ không?
  • Gần đây có thay đổi gì?

② Kiểm tra ngoại quan bằng mắt
  • Xác nhận có điện
  • Tình trạng bẩn dàn ngưng/dàn bay hơi
  • Vết rò dầu/gas (vết dầu)
  • Bất thường ở dây điện

③ Kiểm tra điều kiện vận hành
  • Máy nén có khởi động không
  • Đọc đồng hồ áp cao/áp thấp
  • Đo dòng vận hành
  • Kiểm tra hoạt động quạt

④ Đo nhiệt độ
  • Nhiệt độ ống hút
  • Nhiệt độ ống đẩy
  • Vào/ra dàn ngưng
  • Nhiệt độ phòng/buồng

⑤ Tính độ quá nhiệt/quá lạnh
  • Xác nhận trong khoảng bình thường

⑥ Chẩn đoán và xử lý
  • Bắt đầu từ nguyên nhân khả năng cao nhất
  • Sửa với can thiệp tối thiểu

⑦ Xác nhận sau sửa chữa
  • Đạt đến nhiệt độ cài đặt
  • Đo lại dòng vận hành
  • Giải thích cho khách`,
    content_th: `ลำดับการตรวจระบบอย่างเป็นระบบในงานสนาม

① ฟังอาการจากลูกค้า
  • เริ่มเมื่อไหร่? ทันทีหรือค่อยเป็นค่อยไป?
  • มีเสียง/กลิ่นผิดปกติไหม?
  • มีการเปลี่ยนแปลงล่าสุดไหม?

② ตรวจภายนอกด้วยสายตา
  • ตรวจว่ามีไฟฟ้าจ่าย
  • สภาพความสกปรกของคอนเดนเซอร์/อีวาปอเรเตอร์
  • ร่องรอยการรั่วของน้ำมัน/น้ำยา (คราบน้ำมัน)
  • ความผิดปกติของสายไฟ

③ ตรวจสภาพการทำงาน
  • คอมเพรสเซอร์เดินหรือไม่
  • อ่านเกจแรงดันสูง/ต่ำ
  • วัดกระแสทำงาน
  • ตรวจการทำงานของพัดลม

④ วัดอุณหภูมิ
  • อุณหภูมิท่อดูด
  • อุณหภูมิท่อส่ง
  • ทางเข้า/ออกคอนเดนเซอร์
  • อุณหภูมิห้อง/ตู้

⑤ คำนวณซูเปอร์ฮีต/ซับคูล
  • ยืนยันว่าอยู่ในช่วงปกติ

⑥ วินิจฉัยและดำเนินการ
  • เริ่มจากสาเหตุที่เป็นไปได้มากที่สุด
  • พยายามซ่อมด้วยการแทรกแซงน้อยที่สุด

⑦ ยืนยันหลังซ่อม
  • อุณหภูมิถึงค่าที่ตั้งหรือไม่
  • วัดกระแสทำงานอีกครั้ง
  • อธิบายให้ลูกค้า`,
    content_id: `Urutan inspeksi sistem yang sistematis di lapangan.

① Dengarkan keluhan pelanggan
  • Sejak kapan? Tiba-tiba/perlahan?
  • Ada suara/bau aneh?
  • Ada perubahan baru-baru ini?

② Inspeksi visual eksternal
  • Pastikan ada daya
  • Status kotor kondensor/evaporator
  • Jejak kebocoran oli/refrigeran (noda oli)
  • Kelainan kabel

③ Cek kondisi operasi
  • Kompresor start/jalan
  • Bacaan gauge tekanan tinggi/rendah
  • Ukur arus operasi
  • Cek operasi kipas

④ Pengukuran suhu
  • Suhu pipa hisap
  • Suhu pipa discharge
  • Inlet/outlet kondensor
  • Suhu ruangan/kabinet

⑤ Hitung superheat/subcooling
  • Konfirmasi dalam rentang normal

⑥ Diagnosa dan tindakan
  • Mulai dari penyebab paling mungkin
  • Coba perbaiki dengan intervensi minimal

⑦ Verifikasi setelah perbaikan
  • Konfirmasi suhu mencapai setpoint
  • Cek ulang arus operasi
  • Jelaskan ke pelanggan`,
    content_ar: `تسلسل فحص ميداني منهجي لاستدعاءات الخدمة.

① استمع لشكوى العميل
  • متى بدأ؟ فجأة/تدريجياً؟
  • أي أصوات/روائح غير معتادة؟
  • أي تغييرات حديثة في النظام؟

② فحص بصري خارجي
  • تأكد من وجود التيار
  • حالة اتساخ المكثف/المبخر
  • آثار تسرب الزيت/الفريون (بقع زيت)
  • شذوذ في الأسلاك

③ فحص حالة التشغيل
  • هل يبدأ الضاغط ويعمل
  • قراءات مؤشرات الضغط العالي/المنخفض
  • قياس تيار التشغيل
  • فحص عمل المروحة

④ قياسات الحرارة
  • حرارة أنبوب السحب
  • حرارة أنبوب التصريف
  • مدخل/مخرج المكثف
  • حرارة الغرفة/الخزانة

⑤ حساب الإحماء/التبريد الفائق
  • التأكد من أنها ضمن المدى الطبيعي

⑥ التشخيص واتخاذ الإجراء
  • ابدأ من السبب الأرجح
  • حاول الإصلاح بأقل تدخل

⑦ التحقق بعد الإصلاح
  • التأكد من وصول الحرارة لقيمة الضبط
  • إعادة فحص تيار التشغيل
  • اشرح للعميل`,
  },
  {
    id: 'special_systems',
    title: '특수 냉동 시스템',
    title_en: 'Special Refrigeration Systems',
    title_zh: '特殊制冷系统',
    title_ja: '特殊冷凍システム',
    title_es: 'Sistemas de refrigeración especiales',
    title_hi: 'विशेष रेफ्रिजरेशन सिस्टम',
    title_vi: 'Các hệ thống lạnh đặc biệt',
    title_th: 'ระบบทำความเย็นพิเศษ',
    title_id: 'Sistem refrigerasi khusus',
    title_ar: 'أنظمة التبريد الخاصة',
    icon: '🏭',
    content: `현장에서 만날 수 있는 특수 설비:

▶ 이원 냉동기 (Cascade System)
  2개 냉동회로를 연결, -60°C 이하 초저온
  • 고온 회로(R-404A)가 저온 회로(R-23) 응축기 냉각
  • 참치 냉동, 의료/연구용

▶ 이단 압축기 (Two-Stage)
  압축을 2단계로 나눔, 극저온용
  • 중간냉각기(Intercooler) 있음
  • 효율 높고 압축비 낮음

▶ 칠러 (Chiller)
  냉수(5~10°C) 생산해서 건물/공장에 공급
  • 공랭식/수랭식 구분
  • 팽창탱크, 순환펌프, 버퍼탱크 세트

▶ 브라인/글리콜 냉동기
  냉매 대신 염수(브라인)나 글리콜 순환
  • 간접냉각 → 식품 위생에 유리
  • 배관 길어도 가능
  • 농도 관리 중요 (동결점 확인)

▶ 암모니아 냉동기
  효율 최고, 대형 식품공장/물류센터
  • 독성 강함 — 자격증/보호장비 필수
  • 누설 감지기 필수 설치
  • 동/합금 배관 사용 불가 (부식)

▶ CO₂ 냉동기
  친환경, 마트/편의점 확대 중
  • 초고압 (150bar 이상) — 전용 장비 필요
  • 임계점 주의 (31°C 이상 시 초임계)`,
    content_en: `Specialized systems you may encounter in the field:

▶ Cascade System
  Two refrigeration circuits connected in series, for ultra-low temperatures below -60°C
  • High-temperature circuit (R-404A) cools condenser of low-temperature circuit (R-23)
  • Used for tuna freezing, medical/research applications

▶ Two-Stage Compressor
  Compression split into two stages, for very low temperatures
  • Has an intercooler between stages
  • High efficiency and lower compression ratio

▶ Chiller
  Produces chilled water (5~10°C) for distribution to buildings/factories
  • Available in air-cooled and water-cooled types
  • Includes expansion tank, circulation pump, and buffer tank

▶ Brine / Glycol Refrigeration System
  Circulates brine (salt water) or glycol instead of direct refrigerant
  • Indirect cooling → better for food hygiene
  • Can handle long piping runs
  • Concentration management critical (check freeze point)

▶ Ammonia Refrigeration System
  Highest efficiency, used in large food plants and logistics centers
  • Highly toxic — certification and protective equipment required
  • Leak detector mandatory
  • Cannot use copper or copper-alloy piping (corrosion)

▶ CO₂ Refrigeration System
  Eco-friendly, expanding in supermarkets and convenience stores
  • Ultra-high pressure (150 bar+) — specialized equipment required
  • Watch for transcritical point (above 31°C enters transcritical region)`,
    content_zh: `现场可能遇到的特殊设备:

▶ 复叠系统 (Cascade System)
  两个制冷回路串联,用于 -60°C 以下超低温
  • 高温回路 (R-404A) 冷却低温回路 (R-23) 的冷凝器
  • 用于金枪鱼冷冻、医疗/研究

▶ 二级压缩 (Two-Stage)
  将压缩分为两级,用于极低温
  • 有中间冷却器 (Intercooler)
  • 效率高,压缩比低

▶ 冷水机组 (Chiller)
  生产冷水 (5~10°C) 供应建筑物/工厂
  • 分风冷式/水冷式
  • 配有膨胀水箱、循环泵、缓冲水箱

▶ 盐水/乙二醇冷冻系统
  循环盐水或乙二醇代替直接制冷剂
  • 间接冷却 → 适合食品卫生
  • 可使用长管路
  • 浓度管理重要 (确认冰点)

▶ 氨制冷系统
  效率最高,用于大型食品厂/物流中心
  • 毒性强 — 必须有资质和防护装备
  • 必须安装泄漏检测器
  • 不可使用铜或铜合金管 (腐蚀)

▶ CO₂ 制冷系统
  环保,在超市/便利店扩展
  • 超高压 (150bar 以上) — 需要专用设备
  • 注意临界点 (31°C 以上进入超临界)`,
    content_ja: `現場で出会う特殊設備:

▶ カスケード冷凍機 (Cascade System)
  2つの冷凍回路を直列接続、-60°C以下の超低温
  • 高温回路(R-404A)が低温回路(R-23)の凝縮器を冷却
  • マグロ冷凍、医療/研究用

▶ 二段圧縮 (Two-Stage)
  圧縮を2段階に分ける、極低温用
  • 中間冷却器(インタークーラー)あり
  • 効率高く圧縮比低い

▶ チラー (Chiller)
  冷水(5~10°C)を生産し建物/工場へ供給
  • 空冷式/水冷式
  • 膨張タンク、循環ポンプ、バッファタンクセット

▶ ブライン/グリコール冷凍機
  冷媒の代わりに塩水(ブライン)やグリコールを循環
  • 間接冷却 → 食品衛生に有利
  • 配管が長くても可能
  • 濃度管理重要(凍結点確認)

▶ アンモニア冷凍機
  効率最高、大型食品工場/物流センター
  • 毒性強 — 資格/保護具必須
  • 漏洩検知器必須
  • 銅/銅合金配管使用不可(腐食)

▶ CO₂ 冷凍機
  環境配慮、スーパー/コンビニで拡大
  • 超高圧(150bar以上) — 専用機器必要
  • 臨界点注意(31°C以上で超臨界)`,
    content_es: `Sistemas especializados que puede encontrar en el campo:

▶ Sistema en Cascada (Cascade)
  Dos circuitos en serie, para temperaturas muy bajas (-60°C o menos)
  • Circuito de alta (R-404A) enfría el condensador del de baja (R-23)
  • Usado para congelación de atún, aplicaciones médicas/de investigación

▶ Compresor de Dos Etapas (Two-Stage)
  Compresión dividida en dos etapas, para temperaturas muy bajas
  • Tiene un intercooler entre etapas
  • Alta eficiencia y menor relación de compresión

▶ Chiller
  Produce agua helada (5~10°C) para distribución a edificios/fábricas
  • Tipos enfriado por aire o por agua
  • Incluye tanque de expansión, bomba de circulación y tanque buffer

▶ Sistema de Salmuera / Glicol
  Circula salmuera o glicol en lugar del refrigerante directo
  • Enfriamiento indirecto → mejor para higiene alimentaria
  • Soporta tuberías largas
  • Manejo de concentración crítico (verificar punto de congelación)

▶ Sistema de Refrigeración con Amoníaco
  Mayor eficiencia, en grandes plantas alimentarias y centros logísticos
  • Altamente tóxico — requiere certificación y EPP
  • Detector de fugas obligatorio
  • No se permite tubería de cobre o aleaciones (corrosión)

▶ Sistema de Refrigeración con CO₂
  Ecológico, en expansión en supermercados y tiendas de conveniencia
  • Presión muy alta (150 bar+) — equipo especializado requerido
  • Atención al punto transcrítico (sobre 31°C entra en transcrítico)`,
    content_hi: `Field में मिलने वाले विशेष systems:

▶ Cascade System
  दो रेफ्रिजरेशन circuits क्रम में जुड़े, -60°C से नीचे ultra-low तापमान के लिए
  • High-temperature circuit (R-404A) low-temperature circuit (R-23) के condenser को ठंडा करता है
  • टूना फ्रीजिंग, चिकित्सा/अनुसंधान

▶ Two-Stage Compressor
  Compression को दो चरणों में बाँटा, अत्यंत निम्न तापमान के लिए
  • चरणों के बीच intercooler
  • उच्च efficiency और कम compression ratio

▶ Chiller
  Chilled water (5~10°C) उत्पादन कर भवन/कारखानों को आपूर्ति
  • Air-cooled / water-cooled प्रकार
  • Expansion tank, circulation pump, buffer tank शामिल

▶ Brine / Glycol Refrigeration System
  सीधे रेफ्रिजरेंट के बजाय brine (salt water) या glycol circulate
  • Indirect cooling → खाद्य स्वच्छता के लिए बेहतर
  • लंबी piping handle कर सकता है
  • Concentration management महत्वपूर्ण (freeze point जाँचें)

▶ Ammonia Refrigeration System
  सबसे अधिक efficiency, बड़े खाद्य संयंत्रों और logistics centers में
  • अत्यधिक विषैला — certification और सुरक्षा उपकरण ज़रूरी
  • Leak detector अनिवार्य
  • Copper या copper-alloy piping उपयोग नहीं (corrosion)

▶ CO₂ Refrigeration System
  Eco-friendly, supermarkets और convenience stores में बढ़ रहा
  • अति उच्च दबाव (150 bar+) — विशेष उपकरण ज़रूरी
  • Transcritical point का ध्यान (31°C से ऊपर transcritical क्षेत्र)`,
    content_vi: `Các hệ đặc biệt có thể gặp tại hiện trường:

▶ Hệ thống tầng (Cascade)
  Hai vòng lạnh nối tiếp, cho nhiệt độ cực thấp dưới -60°C
  • Vòng cao (R-404A) làm mát dàn ngưng vòng thấp (R-23)
  • Cấp đông cá ngừ, ứng dụng y tế/nghiên cứu

▶ Máy nén hai cấp (Two-Stage)
  Nén chia hai cấp, dùng cho nhiệt độ rất thấp
  • Có làm mát trung gian (intercooler)
  • Hiệu suất cao, tỉ số nén thấp

▶ Chiller
  Sản xuất nước lạnh (5~10°C) cấp cho tòa nhà/nhà máy
  • Có loại giải nhiệt gió/nước
  • Kèm bình giãn nở, bơm tuần hoàn, bình đệm

▶ Hệ Brine / Glycol
  Tuần hoàn nước muối (brine) hoặc glycol thay vì gas trực tiếp
  • Làm lạnh gián tiếp → tốt cho vệ sinh thực phẩm
  • Có thể dùng đường ống dài
  • Quản lý nồng độ quan trọng (kiểm tra điểm đông)

▶ Hệ Amoniac
  Hiệu suất cao nhất, dùng cho nhà máy thực phẩm lớn/trung tâm logistics
  • Độc tính cao — bắt buộc có chứng chỉ và thiết bị bảo hộ
  • Bắt buộc lắp đầu dò rò
  • Không dùng ống đồng/hợp kim đồng (ăn mòn)

▶ Hệ CO₂
  Thân thiện môi trường, đang mở rộng ở siêu thị/cửa hàng tiện lợi
  • Áp cực cao (trên 150 bar) — cần thiết bị chuyên dụng
  • Chú ý điểm tới hạn (trên 31°C vào vùng transcritical)`,
    content_th: `ระบบพิเศษที่อาจพบในงานสนาม:

▶ Cascade System (ระบบสองชั้น)
  วงจรทำความเย็น 2 วงจรต่ออนุกรม สำหรับอุณหภูมิต่ำกว่า -60°C
  • วงจรอุณหภูมิสูง (R-404A) ระบายความร้อนคอนเดนเซอร์ของวงจรอุณหภูมิต่ำ (R-23)
  • ใช้แช่แข็งปลาทูน่า, ใช้ในงานแพทย์/วิจัย

▶ Two-Stage Compressor (สองขั้น)
  แบ่งการอัดเป็น 2 ขั้น ใช้กับอุณหภูมิต่ำมาก
  • มี intercooler ระหว่างขั้น
  • ประสิทธิภาพสูง อัตราการอัดต่ำ

▶ Chiller (ชิลเลอร์)
  ผลิตน้ำเย็น (5~10°C) ส่งให้อาคาร/โรงงาน
  • มีแบบระบายอากาศและระบายด้วยน้ำ
  • มีถังขยายตัว, ปั๊มหมุนเวียน, ถัง buffer

▶ ระบบ Brine / Glycol
  หมุนเวียน brine หรือ glycol แทนน้ำยาตรง
  • ระบายความเย็นทางอ้อม → เหมาะกับสุขอนามัยอาหาร
  • รองรับท่อยาวได้
  • การจัดการความเข้มข้นสำคัญ (ตรวจจุดเยือกแข็ง)

▶ ระบบแอมโมเนีย
  ประสิทธิภาพสูงสุด ใช้ในโรงงานอาหารใหญ่/ศูนย์โลจิสติกส์
  • พิษรุนแรง — ต้องมีใบอนุญาตและอุปกรณ์ป้องกัน
  • ต้องมีเซ็นเซอร์ตรวจรั่ว
  • ห้ามใช้ท่อทองแดงหรือทองเหลือง (กัดกร่อน)

▶ ระบบ CO₂
  เป็นมิตรต่อสิ่งแวดล้อม กำลังขยายในซูเปอร์/ร้านสะดวกซื้อ
  • ความดันสูงมาก (150 bar+) — ต้องใช้อุปกรณ์เฉพาะ
  • ระวังจุด transcritical (เกิน 31°C เข้าสู่สภาพ transcritical)`,
    content_id: `Sistem khusus yang mungkin Anda temui di lapangan:

▶ Cascade System
  Dua sirkuit refrigerasi terhubung seri, untuk suhu sangat rendah di bawah -60°C
  • Sirkuit suhu tinggi (R-404A) mendinginkan kondensor sirkuit suhu rendah (R-23)
  • Untuk pembekuan tuna, aplikasi medis/riset

▶ Two-Stage Compressor (Dua Tahap)
  Kompresi dibagi dua tahap, untuk suhu sangat rendah
  • Ada intercooler di antara tahap
  • Efisiensi tinggi dan rasio kompresi rendah

▶ Chiller
  Memproduksi air dingin (5~10°C) untuk gedung/pabrik
  • Tipe air-cooled dan water-cooled tersedia
  • Termasuk tangki ekspansi, pompa sirkulasi, dan tangki buffer

▶ Brine / Glycol Refrigeration System
  Mensirkulasikan brine (air garam) atau glycol bukan refrigeran langsung
  • Pendinginan tidak langsung → lebih baik untuk higienitas pangan
  • Bisa untuk pipa panjang
  • Manajemen konsentrasi penting (cek titik beku)

▶ Sistem Refrigerasi Amonia
  Efisiensi tertinggi, di pabrik makanan besar dan pusat logistik
  • Sangat beracun — sertifikasi dan APD wajib
  • Detektor kebocoran wajib
  • Pipa tembaga/paduan tembaga tidak boleh (korosi)

▶ Sistem Refrigerasi CO₂
  Ramah lingkungan, berkembang di supermarket dan minimarket
  • Tekanan sangat tinggi (150 bar+) — alat khusus
  • Perhatikan titik transkritis (di atas 31°C masuk transkritis)`,
    content_ar: `أنظمة متخصصة قد تصادفها في الموقع:

▶ نظام تتالي (Cascade)
  دائرتان متتاليتان للحرارة المنخفضة جداً تحت -60°م
  • الدائرة عالية الحرارة (R-404A) تبرّد مكثف الدائرة منخفضة الحرارة (R-23)
  • تجميد التونا، تطبيقات طبية/بحثية

▶ ضاغط ثنائي المرحلة (Two-Stage)
  الضغط على مرحلتين، للحرارة المنخفضة جداً
  • مع مبرد بيني (Intercooler)
  • كفاءة عالية ونسبة ضغط منخفضة

▶ مبرد المياه (Chiller)
  ينتج ماءً بارداً (5~10°م) للمباني/المصانع
  • متوفر مبرد بالهواء أو الماء
  • يشمل خزان تمدد، مضخة دوران، خزان buffer

▶ نظام Brine / Glycol
  يدوّر محلول ملحي أو غليكول بدل الفريون مباشرة
  • تبريد غير مباشر → مناسب لسلامة الغذاء
  • يدعم أنابيب طويلة
  • إدارة التركيز ضرورية (تحقق من نقطة التجمد)

▶ نظام أمونيا
  الأعلى كفاءة، يُستخدم في مصانع الغذاء الكبرى ومراكز اللوجستيات
  • شديد السمية — يلزم تصريح ومعدات حماية
  • كاشف التسرب إلزامي
  • لا يُستخدم نحاس أو سبائكه (تآكل)

▶ نظام CO₂
  صديق للبيئة، يتوسع في الأسواق ومتاجر التموين
  • ضغط فائق (150 بار+) — تتطلب معدات متخصصة
  • انتبه لنقطة التحويل الحرجة (فوق 31°م يدخل المنطقة فوق الحرجة)`,
  },
  {
    id: 'safety',
    title: '안전 수칙',
    title_en: 'Safety Guidelines',
    title_zh: '安全规程',
    title_ja: '安全規則',
    title_es: 'Normas de seguridad',
    title_hi: 'सुरक्षा निर्देश',
    title_vi: 'Quy tắc an toàn',
    title_th: 'ข้อปฏิบัติด้านความปลอดภัย',
    title_id: 'Pedoman keselamatan',
    title_ar: 'إرشادات السلامة',
    icon: '🦺',
    content: `현장에서 반드시 지켜야 할 안전 수칙입니다.

▶ 냉매 취급:
• 냉매는 피부/눈에 닿으면 동상 위험
  → 보호장갑, 보안경 착용
• 밀폐 공간에서 누설 시 산소 결핍
  → 환기 필수, 감지기 휴대
• R-32, R-290은 가연성
  → 화기 엄금, 스파크 주의

▶ 전기 작업:
• 반드시 전원 차단 후 작업
• 잔류 전압 확인 (콘덴서 방전)
• 고압부 작업 시 절연장갑 착용
• 비 맞는 환경에서 전기 작업 금지

▶ 고압 계통:
• 고압 호스 연결 전 압력 확인
• 급격한 감압 금지 (동파/부상 위험)
• 안전밸브 작동 방향 확인

▶ 작업 후 확인:
• 공구 및 부품 잔류 없는지 확인
• 전기 패널 커버 닫기
• 냉매 누설 여부 비눗물/감지기로 확인
• 운전 상태 최소 15분 이상 확인 후 철수`,
    content_en: `Safety rules that must be followed in the field.

▶ Refrigerant handling:
• Refrigerant contact with skin/eyes causes frostbite risk
  → Wear protective gloves and safety goggles
• Leaks in enclosed spaces cause oxygen deficiency
  → Ensure ventilation, carry a gas detector
• R-32 and R-290 are flammable
  → No open flames, beware of sparks

▶ Electrical work:
• Always disconnect power before working
• Check for residual voltage (discharge capacitors)
• Wear insulating gloves when working on high-voltage components
• Never perform electrical work in rain or wet conditions

▶ High-pressure systems:
• Check pressure before connecting high-pressure hoses
• Do not rapidly depressurize (risk of freeze injury or damage)
• Confirm safety valve discharge direction

▶ Post-work checks:
• Confirm no tools or parts left inside equipment
• Close all electrical panel covers
• Check for refrigerant leaks using soap solution or detector
• Observe system operation for at least 15 minutes before leaving`,
    content_zh: `现场作业时必须遵守的安全规程。

▶ 制冷剂处理:
• 制冷剂接触皮肤/眼睛有冻伤风险
  → 佩戴防护手套和护目镜
• 密闭空间内泄漏会导致缺氧
  → 必须通风,携带检测器
• R-32, R-290 是可燃性的
  → 严禁明火,注意火花

▶ 电气作业:
• 必须先切断电源再作业
• 确认残余电压 (电容器放电)
• 高压部位作业需戴绝缘手套
• 雨水环境中禁止电气作业

▶ 高压系统:
• 高压软管连接前需确认压力
• 禁止快速降压 (冻伤/受伤风险)
• 确认安全阀排放方向

▶ 作业后确认:
• 确认无工具/零件残留
• 关闭电气面板盖
• 用肥皂水/检测器确认有无泄漏
• 至少观察 15 分钟运行状态后离开`,
    content_ja: `現場で必ず守るべき安全規則です。

▶ 冷媒取扱い:
• 冷媒は皮膚/目に触れると凍傷の危険
  → 保護手袋、保護メガネ着用
• 密閉空間での漏洩は酸欠の危険
  → 換気必須、検知器携帯
• R-32, R-290は可燃性
  → 火気厳禁、火花注意

▶ 電気作業:
• 必ず電源遮断後に作業
• 残留電圧確認 (コンデンサ放電)
• 高圧部の作業は絶縁手袋着用
• 雨天時の電気作業禁止

▶ 高圧系統:
• 高圧ホース接続前に圧力確認
• 急激な減圧禁止 (凍傷/負傷の危険)
• 安全弁の作動方向確認

▶ 作業後の確認:
• 工具・部品の残留がないか確認
• 電気パネルカバーを閉める
• 冷媒漏れを石鹸水/検知器で確認
• 運転状態を最低15分以上確認後撤収`,
    content_es: `Reglas de seguridad obligatorias en el campo.

▶ Manejo de refrigerante:
• El contacto del refrigerante con piel/ojos causa congelación
  → Usar guantes de protección y gafas de seguridad
• Las fugas en espacios cerrados causan deficiencia de oxígeno
  → Garantizar ventilación, llevar detector de gas
• R-32 y R-290 son inflamables
  → Sin llamas abiertas, cuidado con chispas

▶ Trabajos eléctricos:
• Desconectar siempre la alimentación antes de trabajar
• Verificar tensión residual (descarga de condensadores)
• Usar guantes aislantes en componentes de alta tensión
• No realizar trabajos eléctricos en lluvia o húmedo

▶ Sistemas de alta presión:
• Verificar la presión antes de conectar mangueras de alta
• No despresurizar rápidamente (riesgo de lesión por congelación o daño)
• Confirmar la dirección de descarga de la válvula de seguridad

▶ Verificaciones post-trabajo:
• Confirmar que no quedan herramientas/piezas dentro del equipo
• Cerrar las cubiertas de los paneles eléctricos
• Detectar fugas con agua jabonosa o detector
• Observar el sistema en operación al menos 15 minutos antes de retirarse`,
    content_hi: `Field में अनिवार्य सुरक्षा नियम।

▶ रेफ्रिजरेंट संभालना:
• त्वचा/आंखों के संपर्क में frostbite का खतरा
  → सुरक्षा दस्ताने और चश्मा पहनें
• बंद जगह में leak से ऑक्सीजन की कमी
  → वेंटिलेशन ज़रूरी, gas detector साथ रखें
• R-32, R-290 ज्वलनशील हैं
  → खुली आग वर्जित, चिंगारी सावधानी

▶ Electrical कार्य:
• पहले हमेशा power बंद करें
• Residual voltage जाँचें (capacitor discharge)
• High-voltage parts पर insulating gloves पहनें
• बारिश/गीली परिस्थितियों में electrical कार्य कभी नहीं

▶ High-pressure systems:
• High-pressure hose जोड़ने से पहले दबाव जाँचें
• तेज़ depressurize न करें (freeze injury/damage खतरा)
• Safety valve discharge direction जाँचें

▶ कार्य के बाद जाँच:
• उपकरण के अंदर कोई tool/part छोड़ा नहीं पुष्टि
• सभी electrical panel covers बंद
• साबुन के पानी/detector से रिसाव जाँच
• निकलने से पहले कम से कम 15 मिनट system operation देखें`,
    content_vi: `Quy tắc an toàn bắt buộc tại hiện trường.

▶ Xử lý gas lạnh:
• Tiếp xúc da/mắt có nguy cơ bỏng lạnh
  → Đeo găng tay và kính bảo hộ
• Rò trong không gian kín gây thiếu oxy
  → Bắt buộc thông gió, mang theo máy dò
• R-32, R-290 là gas dễ cháy
  → Cấm lửa, tránh tia lửa

▶ Công việc điện:
• Luôn ngắt điện trước khi làm
• Kiểm tra điện áp dư (xả tụ điện)
• Đeo găng cách điện khi làm với phần cao áp
• Không làm điện trong mưa hoặc môi trường ẩm

▶ Hệ thống áp cao:
• Kiểm tra áp trước khi kết nối ống cao áp
• Không xả áp nhanh (nguy cơ bỏng lạnh/thương tích)
• Xác nhận hướng xả của van an toàn

▶ Kiểm tra sau công việc:
• Đảm bảo không để dụng cụ/linh kiện trong thiết bị
• Đóng tất cả nắp tủ điện
• Kiểm tra rò bằng nước xà phòng hoặc máy dò
• Theo dõi vận hành ít nhất 15 phút trước khi rời`,
    content_th: `กฎความปลอดภัยที่ต้องปฏิบัติในงานสนาม

▶ การจัดการน้ำยา:
• น้ำยาสัมผัสผิวหนัง/ดวงตาเสี่ยงน้ำแข็งกัด
  → สวมถุงมือและแว่นนิรภัย
• การรั่วในที่ปิดทำให้ขาดออกซิเจน
  → ต้องระบายอากาศ พกอุปกรณ์ตรวจจับก๊าซ
• R-32, R-290 ติดไฟได้
  → ห้ามเปลวไฟ ระวังประกายไฟ

▶ งานไฟฟ้า:
• ตัดไฟก่อนทำงานเสมอ
• ตรวจแรงดันตกค้าง (ปล่อยประจุตัวเก็บประจุ)
• ใส่ถุงมือฉนวนเมื่อทำงานกับชิ้นส่วนแรงดันสูง
• ห้ามทำงานไฟฟ้าในฝน/พื้นที่เปียก

▶ ระบบแรงดันสูง:
• ตรวจแรงดันก่อนต่อท่ออ่อนแรงดันสูง
• ห้ามลดแรงดันอย่างรวดเร็ว (เสี่ยงน้ำแข็งกัด/บาดเจ็บ)
• ตรวจทิศทางระบายของวาล์วนิรภัย

▶ ตรวจหลังทำงาน:
• ตรวจไม่มีเครื่องมือ/อะไหล่ตกค้าง
• ปิดฝาตู้ไฟฟ้า
• ตรวจการรั่วด้วยน้ำสบู่/อุปกรณ์ตรวจจับ
• สังเกตการทำงานอย่างน้อย 15 นาทีก่อนออก`,
    content_id: `Aturan keselamatan yang wajib dipatuhi di lapangan.

▶ Penanganan refrigeran:
• Kontak refrigeran dengan kulit/mata berisiko frostbite
  → Pakai sarung tangan dan kacamata pelindung
• Kebocoran di ruang tertutup menyebabkan kekurangan oksigen
  → Pastikan ventilasi, bawa detektor gas
• R-32 dan R-290 mudah terbakar
  → Tidak ada api terbuka, hati-hati percikan

▶ Pekerjaan listrik:
• Selalu putus daya sebelum bekerja
• Cek tegangan sisa (discharge kapasitor)
• Pakai sarung tangan isolasi pada komponen tegangan tinggi
• Jangan kerja listrik saat hujan/kondisi basah

▶ Sistem tekanan tinggi:
• Cek tekanan sebelum menyambung selang tekanan tinggi
• Jangan turunkan tekanan secara cepat (risiko cedera beku/kerusakan)
• Konfirmasi arah pelepasan katup keselamatan

▶ Pemeriksaan setelah kerja:
• Pastikan tidak ada alat/komponen tertinggal
• Tutup semua panel listrik
• Cek kebocoran dengan air sabun atau detektor
• Amati operasi sistem minimal 15 menit sebelum meninggalkan lokasi`,
    content_ar: `قواعد السلامة الواجب اتباعها في الموقع.

▶ التعامل مع الفريون:
• ملامسة الفريون للجلد/العين تسبب خطر التجمد
  → ارتدِ قفازات وحماية للعين
• التسرب في الأماكن المغلقة يسبب نقص الأوكسجين
  → ضمان التهوية، احمل كاشف الغاز
• R-32 و R-290 قابلان للاشتعال
  → ممنوع اللهب المكشوف، حذار الشرر

▶ الأعمال الكهربائية:
• افصل الطاقة دائماً قبل العمل
• تحقق من الجهد المتبقي (تفريغ المكثفات)
• ارتدِ قفازات عازلة عند العمل على الأجزاء عالية الجهد
• ممنوع العمل الكهربائي في المطر أو الرطوبة

▶ أنظمة الضغط العالي:
• تحقق من الضغط قبل توصيل خراطيم الضغط العالي
• ممنوع تخفيض الضغط بسرعة (خطر التجمد/الإصابة)
• تأكد من اتجاه تصريف صمام الأمان

▶ فحص بعد العمل:
• تأكد من عدم وجود أدوات/قطع متبقية داخل الجهاز
• أغلق أغطية لوحات الكهرباء
• افحص التسرب بماء صابوني أو جهاز كاشف
• راقب التشغيل 15 دقيقة على الأقل قبل المغادرة`,
  },
]
