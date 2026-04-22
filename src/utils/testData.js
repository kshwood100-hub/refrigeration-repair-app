// 테스트 더미 데이터 생성 유틸 (출시 전 제거)
// 9개 테이블에 6개 언어 × 20개 = 120개씩 삽입

import { db } from '../db'

const LANGS = ['ko', 'en', 'zh', 'ja', 'es', 'hi']

const NAMES = {
  ko: ['김영수', '이지현', '박철호', '최민지', '정대성', '한수진', '조현우', '윤서연', '임재원', '송미라',
       '강동욱', '오지은', '배성호', '신혜원', '권태영', '홍예나', '문정호', '서유나', '황준혁', '노아람'],
  en: ['John Smith', 'Mary Johnson', 'David Wilson', 'Sarah Brown', 'Michael Davis', 'Jennifer Miller',
       'Robert Garcia', 'Linda Martinez', 'James Anderson', 'Patricia Taylor', 'William Thomas',
       'Elizabeth Moore', 'Richard Jackson', 'Susan White', 'Joseph Harris', 'Karen Lewis',
       'Charles Clark', 'Nancy Walker', 'Thomas Hall', 'Betty Young'],
  zh: ['王伟', '李娜', '张强', '刘洋', '陈静', '杨帆', '黄磊', '赵敏', '周涛', '吴芳',
       '徐明', '孙丽', '胡军', '朱琳', '郭建', '马云', '高翔', '林雪', '何勇', '罗红'],
  ja: ['田中太郎', '鈴木花子', '佐藤健', '高橋美咲', '渡辺裕', '伊藤愛', '山本翔', '中村舞',
       '小林誠', '加藤結衣', '吉田大輔', '山田優子', '佐々木涼', '松本葵', '井上達也',
       '木村詩織', '林直樹', '清水麻衣', '山崎浩', '森川美穂'],
  es: ['Juan García', 'María López', 'Carlos Rodríguez', 'Ana Martínez', 'Luis Hernández', 'Carmen Pérez',
       'José González', 'Laura Sánchez', 'Miguel Ramírez', 'Isabel Torres', 'Francisco Flores',
       'Lucía Rivera', 'Antonio Morales', 'Elena Ortiz', 'Manuel Castro', 'Pilar Ruiz',
       'Pedro Jiménez', 'Rosa Díaz', 'Alberto Vargas', 'Sofía Romero'],
  hi: ['राज शर्मा', 'प्रिया सिंह', 'अमित कुमार', 'नेहा गुप्ता', 'विकास पटेल', 'पूजा रेड्डी',
       'संजय वर्मा', 'अनिता यादव', 'रवि मिश्रा', 'सुनीता जोशी', 'अरुण चौधरी', 'दीपा नायर',
       'मनोज सिन्हा', 'रितु अग्रवाल', 'विनय त्रिपाठी', 'कविता बोस', 'आशीष पांडे',
       'ज्योति मेनन', 'राहुल सक्सेना', 'मीरा राव'],
}

const COMPANIES = {
  ko: ['대성냉동', '한양식품', '서울마트', '현대호텔', '삼성전자', '롯데백화점', '신세계푸드', '오뚜기'],
  en: ['Cold Storage Inc', 'FreshMart', 'Arctic Foods', 'Polar Systems', 'Frost Corp', 'Chill Zone',
       'IceWorks LLC', 'CoolTech Solutions'],
  zh: ['冷冻食品公司', '北极贸易', '鲜食超市', '冷链物流', '极地科技', '寒冰集团', '冰点公司', '制冷有限'],
  ja: ['冷凍食品株式会社', '北海商事', '極寒ロジスティクス', '氷点システム', '寒冷産業',
       'フロスト商会', '冷凍技術', 'アークティック'],
  es: ['Congelados SA', 'Mercado Frío', 'Ártico Alimentos', 'Polar Logística', 'Refrigeración Total',
       'Hielo Industrial', 'FrigoMax', 'Nevera Express'],
  hi: ['कोल्ड स्टोरेज प्रा लि', 'फ्रेशमार्ट', 'आर्कटिक फूड्स', 'पोलर सिस्टम्स',
       'फ्रॉस्ट कॉर्प', 'चिल ज़ोन', 'आइसवर्क्स', 'कूलटेक'],
}

const ADDRESSES = {
  ko: ['서울 강남구 역삼동 123-45', '부산 해운대구 우동 67-8', '인천 남동구 구월동 234',
       '대구 중구 동성로 56', '광주 서구 치평동 789', '대전 유성구 봉명동 12',
       '경기 성남시 분당구 정자동 345', '울산 남구 삼산동 678', '제주 제주시 연동 901',
       '경북 포항시 북구 양덕동 234', '충북 청주시 상당구 용암동 567', '강원 춘천시 석사동 890',
       '전북 전주시 덕진구 송천동 123', '전남 여수시 학동 456', '경남 창원시 의창구 명서동 789',
       '충남 천안시 동남구 신방동 234', '서울 마포구 합정동 567', '부산 동래구 온천동 890',
       '대구 수성구 범어동 123', '경기 수원시 영통구 매탄동 456'],
  en: ['123 Main St, New York, NY', '456 Oak Ave, Los Angeles, CA', '789 Pine Rd, Chicago, IL',
       '321 Elm St, Houston, TX', '654 Maple Dr, Phoenix, AZ', '987 Cedar Ln, Philadelphia, PA',
       '147 Birch Way, San Antonio, TX', '258 Walnut Pl, San Diego, CA', '369 Cherry Ct, Dallas, TX',
       '741 Ash Blvd, Austin, TX', '852 Hickory St, Jacksonville, FL', '963 Spruce Ave, Columbus, OH',
       '159 Willow Rd, Charlotte, NC', '267 Redwood Dr, Fort Worth, TX', '378 Sequoia Ln, Indianapolis, IN',
       '489 Magnolia Way, Seattle, WA', '591 Dogwood Pl, Denver, CO', '602 Chestnut Ct, Boston, MA',
       '713 Poplar St, Nashville, TN', '824 Juniper Ave, Portland, OR'],
  zh: ['北京市朝阳区建国路88号', '上海市浦东新区陆家嘴100号', '广州市天河区珠江路25号',
       '深圳市南山区科技园3号', '成都市锦江区春熙路56号', '杭州市西湖区文三路78号',
       '武汉市江汉区解放大道120号', '南京市鼓楼区中山北路66号', '西安市雁塔区高新路45号',
       '重庆市渝中区解放碑19号', '天津市和平区南京路203号', '苏州市工业园区星湖街188号',
       '青岛市市南区香港中路77号', '长沙市岳麓区银盆南路12号', '沈阳市和平区太原街32号',
       '大连市中山区友好路55号', '厦门市思明区中山路89号', '郑州市二七区建设东路44号',
       '济南市历下区泺源大街63号', '昆明市五华区青年路158号'],
  ja: ['東京都新宿区西新宿1-2-3', '大阪市北区梅田4-5-6', '名古屋市中区栄7-8-9',
       '横浜市西区みなとみらい10-11', '京都市下京区烏丸通12-13', '札幌市中央区大通14-15',
       '福岡市博多区博多駅前16-17', '神戸市中央区三宮町18-19', '広島市中区紙屋町20-21',
       '仙台市青葉区中央22-23', '千葉市中央区富士見24-25', 'さいたま市大宮区桜木町26-27',
       '静岡市葵区呉服町28-29', '岡山市北区駅元町30-31', '熊本市中央区花畑町32-33',
       '鹿児島市中央町34-35', '那覇市泉崎36-37', '金沢市片町38-39',
       '長崎市浜町40-41', '松山市大街道42-43'],
  es: ['Calle Mayor 45, Madrid', 'Avinguda Diagonal 123, Barcelona', 'Calle Sierpes 67, Sevilla',
       'Gran Vía 89, Bilbao', 'Calle Larios 12, Málaga', 'Paseo del Prado 34, Valencia',
       'Calle Real 56, A Coruña', 'Avenida de la Libertad 78, San Sebastián',
       'Calle Cruz Conde 90, Córdoba', 'Calle Reyes Católicos 11, Granada',
       'Calle San Francisco 22, Palma', 'Avenida del Puerto 33, Alicante',
       'Calle Triana 44, Las Palmas', 'Calle Corredera Baja 55, Cartagena',
       'Calle Fuencarral 66, Móstoles', 'Calle Peña 77, Burgos',
       'Calle Cuatro de Agosto 88, Logroño', 'Avenida de Castilla 99, Valladolid',
       'Calle Bolsería 10, Gandía', 'Plaza del Castillo 20, Pamplona'],
  hi: ['123 मुख्य मार्ग, नई दिल्ली', '456 गांधी रोड, मुंबई', '789 नेहरू नगर, बेंगलुरु',
       '321 अशोक नगर, चेन्नई', '654 सुभाष मार्ग, कोलकाता', '987 पटेल गली, हैदराबाद',
       '147 राजीव चौक, अहमदाबाद', '258 शास्त्री नगर, पुणे', '369 आज़ाद मैदान, जयपुर',
       '741 तिलक रोड, लखनऊ', '852 विवेकानंद मार्ग, कानपुर', '963 रवींद्र पथ, भोपाल',
       '159 कृष्ण नगर, इंदौर', '267 सरदार पटेल रोड, सूरत', '378 नरेंद्र मार्ग, वडोदरा',
       '489 बोस रोड, नागपुर', '591 तिलक नगर, विशाखापत्तनम', '602 लाल बहादुर मार्ग, वाराणसी',
       '713 अंबेडकर नगर, पटना', '824 राणा प्रताप रोड, अमृतसर'],
}

const SYMPTOMS = {
  ko: ['냉매 부족으로 냉각 불량', '압축기 소음 과다', '증발기 성에 과다 발생', '응축기 팬 고장',
       '전자팽창변 작동 불량', '냉동유 순환 불량', '고압 스위치 트립', '저압 스위치 트립',
       '서리 제거 불량', '온도 센서 오류', '팬 모터 회전 불량', '응축 압력 상승',
       '흡입 압력 저하', '과열도 비정상', '과냉각도 부족', '오일 레벨 저하',
       '냉매 누설 의심', '전기 접촉 불량', '제어 기판 오류', '배수 불량'],
  en: ['Refrigerant shortage causing poor cooling', 'Excessive compressor noise',
       'Heavy frost on evaporator', 'Condenser fan failure', 'Expansion valve malfunction',
       'Poor oil circulation', 'High pressure switch trip', 'Low pressure switch trip',
       'Defrost cycle failure', 'Temperature sensor error', 'Fan motor rotation issue',
       'Rising condensing pressure', 'Dropping suction pressure', 'Abnormal superheat',
       'Insufficient subcooling', 'Low oil level', 'Suspected refrigerant leak',
       'Electrical contact issue', 'Control board error', 'Drainage problem'],
  zh: ['制冷剂不足导致冷却不良', '压缩机噪音过大', '蒸发器结霜严重', '冷凝器风扇故障',
       '电子膨胀阀工作异常', '冷冻油循环不良', '高压开关跳闸', '低压开关跳闸',
       '除霜循环失效', '温度传感器错误', '风扇电机转动异常', '冷凝压力上升',
       '吸气压力下降', '过热度异常', '过冷度不足', '油位偏低',
       '疑似制冷剂泄漏', '电气接触不良', '控制板错误', '排水不畅'],
  ja: ['冷媒不足による冷却不良', 'コンプレッサー騒音過大', '蒸発器の着霜過多', '凝縮器ファン故障',
       '電子膨張弁の動作不良', '冷凍油循環不良', '高圧スイッチトリップ', '低圧スイッチトリップ',
       '除霜サイクル不良', '温度センサーエラー', 'ファンモーター回転異常', '凝縮圧力上昇',
       '吸入圧力低下', '過熱度異常', '過冷却度不足', '油面低下',
       '冷媒漏れの疑い', '電気接触不良', '制御基板エラー', '排水不良'],
  es: ['Escasez de refrigerante causa enfriamiento deficiente', 'Ruido excesivo del compresor',
       'Escarcha excesiva en evaporador', 'Falla del ventilador del condensador',
       'Mal funcionamiento de válvula de expansión', 'Mala circulación de aceite',
       'Disparo del presostato de alta', 'Disparo del presostato de baja',
       'Falla del ciclo de descarche', 'Error del sensor de temperatura',
       'Problema de rotación del motor del ventilador', 'Presión de condensación elevada',
       'Presión de succión baja', 'Sobrecalentamiento anormal', 'Subenfriamiento insuficiente',
       'Nivel de aceite bajo', 'Fuga de refrigerante sospechosa', 'Problema de contacto eléctrico',
       'Error de placa de control', 'Problema de drenaje'],
  hi: ['रेफ्रिजरेंट की कमी से कूलिंग खराब', 'कंप्रेसर में अत्यधिक शोर',
       'इवेपोरेटर पर अधिक बर्फ जमाव', 'कंडेंसर पंखा खराब', 'एक्सपैंशन वाल्व खराबी',
       'ऑयल सर्कुलेशन खराब', 'हाई प्रेशर स्विच ट्रिप', 'लो प्रेशर स्विच ट्रिप',
       'डिफ्रॉस्ट साइकिल विफल', 'तापमान सेंसर त्रुटि', 'पंखा मोटर घुमाव समस्या',
       'कंडेंसिंग प्रेशर बढ़ना', 'सक्शन प्रेशर कम', 'असामान्य सुपरहीट',
       'अपर्याप्त सबकूलिंग', 'ऑयल लेवल कम', 'रेफ्रिजरेंट लीक संदेह',
       'विद्युत संपर्क समस्या', 'कंट्रोल बोर्ड त्रुटि', 'ड्रेनेज समस्या'],
}

const CAUSES = {
  ko: ['냉매 충전량 부족', '압축기 베어링 마모', '제상 히터 단선', '응축기 팬모터 고장',
       '팽창변 필터 막힘', '오일분리기 불량', '압력 센서 고장', '과충전 상태',
       '증발기 코일 오염', '배관 막힘', '제어 시스템 이상', '전원 공급 불안정',
       '냉매 배관 누설', '팬 벨트 슬립', '축열 불량', '모터 코일 단락',
       '압력 조절기 오작동', '응축수 드레인 막힘', '필터 드라이어 포화', '고압 튜빙 변형'],
  en: ['Low refrigerant charge', 'Compressor bearing wear', 'Defrost heater burnout',
       'Condenser fan motor failure', 'Expansion valve filter clogged', 'Oil separator fault',
       'Pressure sensor failure', 'Overcharged system', 'Evaporator coil fouling',
       'Pipe blockage', 'Control system malfunction', 'Unstable power supply',
       'Refrigerant pipe leak', 'Fan belt slipping', 'Thermal storage failure',
       'Motor coil short circuit', 'Pressure regulator malfunction', 'Condensate drain clogged',
       'Filter drier saturated', 'High pressure tubing deformation'],
  zh: ['制冷剂充注量不足', '压缩机轴承磨损', '除霜加热器烧断', '冷凝器风扇电机故障',
       '膨胀阀过滤网堵塞', '油分离器故障', '压力传感器损坏', '过量充注',
       '蒸发器盘管污染', '管道堵塞', '控制系统故障', '电源供应不稳',
       '制冷剂管道泄漏', '风扇皮带打滑', '蓄热不良', '电机线圈短路',
       '压力调节器失灵', '冷凝水排水堵塞', '过滤干燥器饱和', '高压管变形'],
  ja: ['冷媒充填量不足', 'コンプレッサー軸受摩耗', 'デフロストヒーター断線',
       '凝縮器ファンモーター故障', '膨張弁フィルター詰まり', 'オイルセパレーター不良',
       '圧力センサー故障', '過充填状態', '蒸発器コイル汚染', '配管詰まり',
       '制御システム異常', '電源供給不安定', '冷媒配管漏れ', 'ファンベルトスリップ',
       '蓄熱不良', 'モーターコイル短絡', '圧力調整器誤作動', '凝縮水ドレン詰まり',
       'フィルタードライヤー飽和', '高圧チューブ変形'],
  es: ['Carga de refrigerante baja', 'Desgaste de rodamientos del compresor',
       'Calentador de descarche fundido', 'Falla del motor del ventilador del condensador',
       'Filtro de válvula de expansión obstruido', 'Falla del separador de aceite',
       'Falla del sensor de presión', 'Sistema sobrecargado', 'Suciedad en serpentín',
       'Obstrucción de tubería', 'Mal funcionamiento del sistema de control',
       'Suministro eléctrico inestable', 'Fuga en tubería de refrigerante',
       'Correa del ventilador patinando', 'Falla del almacenamiento térmico',
       'Cortocircuito en bobina del motor', 'Mal funcionamiento del regulador de presión',
       'Drenaje de condensados obstruido', 'Filtro deshidratador saturado',
       'Deformación de tubería de alta presión'],
  hi: ['रेफ्रिजरेंट चार्ज कम', 'कंप्रेसर बेयरिंग घिसना', 'डिफ्रॉस्ट हीटर जला',
       'कंडेंसर फैन मोटर विफल', 'एक्सपैंशन वाल्व फिल्टर जाम', 'ऑयल सेपरेटर खराब',
       'प्रेशर सेंसर विफल', 'सिस्टम अधिक चार्ज', 'इवेपोरेटर कॉइल गंदा',
       'पाइप अवरोध', 'कंट्रोल सिस्टम खराबी', 'बिजली आपूर्ति अस्थिर',
       'रेफ्रिजरेंट पाइप लीक', 'पंखा बेल्ट फिसलना', 'थर्मल स्टोरेज विफल',
       'मोटर कॉइल शॉर्ट', 'प्रेशर रेगुलेटर खराबी', 'कंडेनसेट ड्रेन जाम',
       'फिल्टर ड्रायर संतृप्त', 'हाई प्रेशर ट्यूबिंग विकृत'],
}

const SOLUTIONS = {
  ko: ['냉매 보충 및 누설 점검', '압축기 교체', '제상 히터 교체', '응축기 팬모터 교체',
       '팽창변 청소 및 교체', '오일 분리기 교체', '압력 센서 교체 후 재설정',
       '냉매 일부 회수', '증발기 세척', '배관 청소', '제어 기판 교체',
       '전원 안정화 장치 설치', '누설 지점 용접 수리', '팬 벨트 교체',
       '축열 시스템 점검', '모터 권선 교체', '압력 조절기 조정', '드레인 청소',
       '필터 드라이어 교체', '고압 튜빙 교체'],
  en: ['Refrigerant top-up and leak check', 'Compressor replacement', 'Defrost heater replacement',
       'Condenser fan motor replacement', 'Expansion valve cleaning and replacement',
       'Oil separator replacement', 'Pressure sensor replacement and reset',
       'Refrigerant partial recovery', 'Evaporator cleaning', 'Pipe cleaning',
       'Control board replacement', 'Power stabilizer installation', 'Leak point welding repair',
       'Fan belt replacement', 'Thermal storage inspection', 'Motor winding replacement',
       'Pressure regulator adjustment', 'Drain cleaning', 'Filter drier replacement',
       'High pressure tubing replacement'],
  zh: ['补充制冷剂并检查泄漏', '更换压缩机', '更换除霜加热器', '更换冷凝器风扇电机',
       '清洁并更换膨胀阀', '更换油分离器', '更换压力传感器并重置',
       '部分回收制冷剂', '清洗蒸发器', '清洁管道', '更换控制板',
       '安装电源稳定器', '焊接修复泄漏点', '更换风扇皮带',
       '检查蓄热系统', '更换电机绕组', '调整压力调节器', '清洁排水',
       '更换过滤干燥器', '更换高压管'],
  ja: ['冷媒補充と漏れ点検', 'コンプレッサー交換', 'デフロストヒーター交換',
       '凝縮器ファンモーター交換', '膨張弁清掃と交換', 'オイルセパレーター交換',
       '圧力センサー交換とリセット', '冷媒一部回収', '蒸発器洗浄', '配管清掃',
       '制御基板交換', '電源安定化装置設置', '漏れ部溶接修理', 'ファンベルト交換',
       '蓄熱システム点検', 'モーター巻線交換', '圧力調整器調整', 'ドレン清掃',
       'フィルタードライヤー交換', '高圧チューブ交換'],
  es: ['Recarga de refrigerante y verificación de fugas', 'Reemplazo del compresor',
       'Reemplazo del calentador de descarche', 'Reemplazo del motor del ventilador',
       'Limpieza y reemplazo de válvula de expansión', 'Reemplazo del separador de aceite',
       'Reemplazo y reinicio del sensor de presión', 'Recuperación parcial de refrigerante',
       'Limpieza del evaporador', 'Limpieza de tubería', 'Reemplazo de placa de control',
       'Instalación de estabilizador de voltaje', 'Reparación por soldadura del punto de fuga',
       'Reemplazo de correa del ventilador', 'Inspección de almacenamiento térmico',
       'Reemplazo de bobinado del motor', 'Ajuste del regulador de presión',
       'Limpieza del drenaje', 'Reemplazo del filtro deshidratador',
       'Reemplazo de tubería de alta presión'],
  hi: ['रेफ्रिजरेंट टॉप-अप और लीक जांच', 'कंप्रेसर बदलना', 'डिफ्रॉस्ट हीटर बदलना',
       'कंडेंसर फैन मोटर बदलना', 'एक्सपैंशन वाल्व सफाई और बदलना', 'ऑयल सेपरेटर बदलना',
       'प्रेशर सेंसर बदलना और रीसेट', 'रेफ्रिजरेंट आंशिक रिकवरी', 'इवेपोरेटर सफाई',
       'पाइप सफाई', 'कंट्रोल बोर्ड बदलना', 'पावर स्टेबलाइज़र लगाना',
       'लीक बिंदु वेल्डिंग मरम्मत', 'पंखा बेल्ट बदलना', 'थर्मल स्टोरेज जांच',
       'मोटर वाइंडिंग बदलना', 'प्रेशर रेगुलेटर समायोजन', 'ड्रेन सफाई',
       'फिल्टर ड्रायर बदलना', 'हाई प्रेशर ट्यूबिंग बदलना'],
}

const EQUIPMENTS = {
  ko: ['냉동창고 A', '쇼케이스 1호', '제빙기', '냉동고 B동', '워크인쿨러', '칠러 유닛', '아이스머신 2', '급속동결기'],
  en: ['Cold Storage A', 'Showcase #1', 'Ice Maker', 'Freezer Bldg B', 'Walk-in Cooler',
       'Chiller Unit', 'Ice Machine 2', 'Blast Freezer'],
  zh: ['冷库A', '展示柜1号', '制冰机', '冷冻库B栋', '步入式冷藏', '冷水机组', '制冰机2', '速冻机'],
  ja: ['冷凍倉庫A', 'ショーケース1号', '製氷機', '冷凍庫B棟', 'ウォークインクーラー',
       'チラーユニット', 'アイスマシン2', '急速冷凍機'],
  es: ['Almacén Frío A', 'Vitrina #1', 'Máquina de Hielo', 'Congelador Edif. B',
       'Cámara Refrigerada', 'Unidad Enfriadora', 'Máquina Hielo 2', 'Congelador Rápido'],
  hi: ['कोल्ड स्टोरेज A', 'शोकेस #1', 'आइस मेकर', 'फ्रीज़र भवन B', 'वॉक-इन कूलर',
       'चिलर यूनिट', 'आइस मशीन 2', 'ब्लास्ट फ्रीज़र'],
}

const TITLES = {
  ko: ['대표', '이사', '부장', '과장', '대리', '점장', '사장', '부사장'],
  en: ['CEO', 'Director', 'Manager', 'Supervisor', 'Team Lead', 'Owner', 'President', 'VP'],
  zh: ['总经理', '董事', '部长', '科长', '代理', '店长', '总裁', '副总裁'],
  ja: ['代表取締役', '取締役', '部長', '課長', '係長', '店長', '社長', '副社長'],
  es: ['Director General', 'Director', 'Gerente', 'Supervisor', 'Jefe de Equipo', 'Propietario', 'Presidente', 'Vicepresidente'],
  hi: ['सीईओ', 'निदेशक', 'प्रबंधक', 'पर्यवेक्षक', 'टीम लीड', 'मालिक', 'अध्यक्ष', 'उपाध्यक्ष'],
}

const PARTS = {
  ko: ['압축기 모델 K-500', '응축기 팬 120W', '팽창변 TXV-25', '필터 드라이어', '오일 분리기',
       '압력 센서 세트', '제상 히터 1kW', '서비스 밸브'],
  en: ['Compressor K-500', 'Condenser Fan 120W', 'TXV-25 Expansion Valve', 'Filter Drier',
       'Oil Separator', 'Pressure Sensor Set', 'Defrost Heater 1kW', 'Service Valve'],
  zh: ['压缩机K-500', '冷凝器风扇120W', 'TXV-25膨胀阀', '过滤干燥器',
       '油分离器', '压力传感器组', '除霜加热器1kW', '维修阀'],
  ja: ['コンプレッサーK-500', '凝縮器ファン120W', 'TXV-25膨張弁', 'フィルタードライヤー',
       'オイルセパレーター', '圧力センサーセット', 'デフロストヒーター1kW', 'サービスバルブ'],
  es: ['Compresor K-500', 'Ventilador Condensador 120W', 'Válvula Expansión TXV-25',
       'Filtro Deshidratador', 'Separador de Aceite', 'Juego Sensor Presión',
       'Calentador Descarche 1kW', 'Válvula de Servicio'],
  hi: ['कंप्रेसर K-500', 'कंडेंसर फैन 120W', 'TXV-25 एक्सपैंशन वाल्व', 'फिल्टर ड्रायर',
       'ऑयल सेपरेटर', 'प्रेशर सेंसर सेट', 'डिफ्रॉस्ट हीटर 1kW', 'सर्विस वाल्व'],
}

const EXPENSE_CATEGORIES = ['출장비', '자재비', '시간인건비', '식대', '숙박비', '시간외수당', '기타']

const EXPENSE_DESC = {
  ko: ['고속도로 통행료', '부품 구매', '점검 작업 3시간', '현장 식사', '1박 숙박', '야간 작업 수당', '기타 경비'],
  en: ['Highway toll', 'Parts purchase', '3 hours inspection', 'Site meal', '1 night stay',
       'Night work allowance', 'Other expense'],
  zh: ['高速公路通行费', '购买零件', '3小时检查', '现场用餐', '住宿1晚', '夜间工作津贴', '其他费用'],
  ja: ['高速道路通行料', '部品購入', '点検作業3時間', '現場食事', '1泊宿泊', '夜間作業手当', 'その他経費'],
  es: ['Peaje de autopista', 'Compra de repuestos', 'Inspección 3 horas', 'Comida en sitio',
       'Hospedaje 1 noche', 'Bonificación trabajo nocturno', 'Otro gasto'],
  hi: ['राजमार्ग टोल', 'पार्ट्स खरीद', '3 घंटे निरीक्षण', 'साइट भोजन', '1 रात ठहरना',
       'रात्रि कार्य भत्ता', 'अन्य खर्च'],
}

const KNOWHOW_CATS = ['압축기', '증발기', '응축기', '팽창변', '냉매', '전기계', '제어', '기타']
const KNOWHOW_LOCS = ['실외기', '실내기', '배관', '전기함', '기타']

const CHECKLIST_TITLES = {
  ko: ['월간 정기점검', '냉매 누설 점검', '압축기 점검', '안전 점검', '전기 설비 점검'],
  en: ['Monthly Inspection', 'Refrigerant Leak Check', 'Compressor Inspection', 'Safety Check', 'Electrical Inspection'],
  zh: ['月度定期检查', '制冷剂泄漏检查', '压缩机检查', '安全检查', '电气设备检查'],
  ja: ['月次定期点検', '冷媒漏れ点検', 'コンプレッサー点検', '安全点検', '電気設備点検'],
  es: ['Inspección Mensual', 'Verificación Fuga Refrigerante', 'Inspección Compresor',
       'Verificación Seguridad', 'Inspección Eléctrica'],
  hi: ['मासिक निरीक्षण', 'रेफ्रिजरेंट लीक जांच', 'कंप्रेसर निरीक्षण', 'सुरक्षा जांच', 'विद्युत निरीक्षण'],
}

const SUPPLIER_ITEMS = {
  ko: ['압축기 부품', '냉매 공급', '전기 부품', '배관 자재', '팬 모터', '센서류', '제어기판', '단열재'],
  en: ['Compressor parts', 'Refrigerant supply', 'Electrical parts', 'Piping materials',
       'Fan motors', 'Sensors', 'Control boards', 'Insulation materials'],
  zh: ['压缩机零件', '制冷剂供应', '电气零件', '管道材料', '风扇电机', '传感器', '控制板', '保温材料'],
  ja: ['コンプレッサー部品', '冷媒供給', '電気部品', '配管材料', 'ファンモーター',
       'センサー類', '制御基板', '断熱材'],
  es: ['Piezas de compresor', 'Suministro refrigerante', 'Piezas eléctricas', 'Materiales de tubería',
       'Motores de ventilador', 'Sensores', 'Placas de control', 'Materiales aislantes'],
  hi: ['कंप्रेसर पार्ट्स', 'रेफ्रिजरेंट आपूर्ति', 'विद्युत पार्ट्स', 'पाइप सामग्री',
       'पंखा मोटर', 'सेंसर', 'कंट्रोल बोर्ड', 'इन्सुलेशन सामग्री'],
}

const CHECK_WORDS = {
  ko: ['확인', '점검'],
  en: ['Check', 'Inspect'],
  zh: ['检查', '检修'],
  ja: ['確認', '点検'],
  es: ['Verificar', 'Inspeccionar'],
  hi: ['जांच', 'निरीक्षण'],
}

const ALARM_NOTES = {
  ko: ['방문 1시간 전 준비', '부품 가져갈 것', '현장 도착 확인', '고객에게 전화'],
  en: ['Prepare 1 hour before visit', 'Bring parts', 'Confirm site arrival', 'Call customer'],
  zh: ['访问前1小时准备', '携带零件', '确认现场到达', '致电客户'],
  ja: ['訪問1時間前に準備', '部品を持参', '現場到着確認', 'お客様に電話'],
  es: ['Preparar 1 hora antes', 'Traer repuestos', 'Confirmar llegada', 'Llamar al cliente'],
  hi: ['विज़िट से 1 घंटा पहले तैयार', 'पार्ट्स लाएं', 'साइट आगमन पुष्टि', 'ग्राहक को कॉल करें'],
}

// 유틸
const pick = (arr, i) => arr[i % arr.length]
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const randPhone = () => `010-${randInt(1000, 9999)}-${randInt(1000, 9999)}`
const randDate = (daysOffset = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + daysOffset)
  return d.toISOString().slice(0, 10)
}
const randTime = () => `${String(randInt(8, 18)).padStart(2, '0')}:${String(randInt(0, 5) * 10).padStart(2, '0')}`
const nowIso = () => new Date().toISOString()
const STATUSES = ['received', 'inprogress', 'completed']

// 생성 메인
export async function insertTestData() {
  // 1) customers (120)
  const customerIds = []
  for (const lang of LANGS) {
    for (let i = 0; i < 20; i++) {
      const id = await db.customers.add({
        name: pick(NAMES[lang], i),
        phone: randPhone(),
        address: pick(ADDRESSES[lang], i),
      })
      customerIds.push(id)
    }
  }

  // 2) service_jobs (120)
  const jobIds = []
  for (let k = 0; k < LANGS.length; k++) {
    const lang = LANGS[k]
    for (let i = 0; i < 20; i++) {
      const cid = customerIds[k * 20 + i]
      const jobId = await db.service_jobs.add({
        customerId: cid,
        status: STATUSES[i % STATUSES.length],
        receiptDate: randDate(-randInt(0, 60)),
        visitDate: randDate(randInt(-30, 10)),
        visitTime: randTime(),
        partsCost: randInt(50, 500) * 1000,
        laborCost: randInt(10, 200) * 1000,
        cost: 0,
        title: `${pick(EQUIPMENTS[lang], i)} - ${pick(SYMPTOMS[lang], i).slice(0, 20)}`,
        category: pick(KNOWHOW_CATS, i),
        location: pick(KNOWHOW_LOCS, i),
        symptoms: pick(SYMPTOMS[lang], i),
        cause: pick(CAUSES[lang], i),
        checkSteps: `1. ${pick(SYMPTOMS[lang], i)} ${CHECK_WORDS[lang][0]}\n2. ${pick(CAUSES[lang], i)} ${CHECK_WORDS[lang][1]}`,
        solution: pick(SOLUTIONS[lang], i),
        parts: pick(PARTS[lang], i),
        notes: '',
        updatedAt: nowIso(),
      })
      jobIds.push(jobId)
    }
  }

  // 3) repair_logs (120)
  for (let k = 0; k < LANGS.length; k++) {
    const lang = LANGS[k]
    for (let i = 0; i < 20; i++) {
      await db.repair_logs.add({
        date: randDate(-randInt(0, 180)),
        equipmentName: pick(EQUIPMENTS[lang], i),
        symptom: pick(SYMPTOMS[lang], i),
        action: pick(SOLUTIONS[lang], i),
        result: i % 3 === 0 ? 'pending' : 'completed',
      })
    }
  }

  // 4) checklist_results (120)
  for (let k = 0; k < LANGS.length; k++) {
    const lang = LANGS[k]
    for (let i = 0; i < 20; i++) {
      const score = randInt(50, 100)
      await db.checklist_results.add({
        templateId: i % 5 + 1,
        templateTitle: pick(CHECKLIST_TITLES[lang], i),
        createdAt: new Date(Date.now() - randInt(0, 90) * 86400000).toISOString(),
        score,
        level: score >= 80 ? 'pass' : 'fail',
        answers: { q1: 'yes', q2: 'no', q3: 'yes' },
        badItems: score < 80 ? [pick(SYMPTOMS[lang], i)] : [],
        midItems: [],
      })
    }
  }

  // 5) expenses (120)
  for (let k = 0; k < LANGS.length; k++) {
    const lang = LANGS[k]
    for (let i = 0; i < 20; i++) {
      const jobId = jobIds[k * 20 + i]
      const cid = customerIds[k * 20 + i]
      await db.expenses.add({
        title: `${pick(EQUIPMENTS[lang], i)} ${i + 1}`,
        date: randDate(-randInt(0, 60)),
        jobId,
        customerId: cid,
        items: [
          { category: EXPENSE_CATEGORIES[i % 7], description: pick(EXPENSE_DESC[lang], i % 7), amount: String(randInt(10, 500) * 1000) },
          { category: EXPENSE_CATEGORIES[(i + 1) % 7], description: pick(EXPENSE_DESC[lang], (i + 1) % 7), amount: String(randInt(10, 200) * 1000) },
        ],
        notes: '',
        photos: [],
        createdAt: nowIso(),
      })
    }
  }

  // 6) knowhow (120)
  for (let k = 0; k < LANGS.length; k++) {
    const lang = LANGS[k]
    for (let i = 0; i < 20; i++) {
      const now = new Date(Date.now() - randInt(0, 120) * 86400000).toISOString()
      await db.knowhow.add({
        title: `${pick(EQUIPMENTS[lang], i)} - ${pick(SYMPTOMS[lang], i).slice(0, 30)}`,
        category: pick(KNOWHOW_CATS, i),
        location: pick(KNOWHOW_LOCS, i),
        compressorType: ['왕복동', '스크롤', '로터리', '스크류'][i % 4],
        compressorStr: `${randInt(1, 50)}HP`,
        coolingMethod: ['공냉', '수냉'][i % 2],
        tempRange: `${randInt(-40, -10)}~${randInt(-5, 10)}°C`,
        refrigerant: ['R-22', 'R-134a', 'R-404A', 'R-407C', 'R-410A'][i % 5],
        systemType: ['직접팽창', '2차냉매', '캐스케이드'][i % 3],
        symptoms: pick(SYMPTOMS[lang], i),
        cause: pick(CAUSES[lang], i),
        checkSteps: `1. ${pick(SYMPTOMS[lang], i)}\n2. ${pick(CAUSES[lang], i)}\n3. ${pick(SOLUTIONS[lang], i)}`,
        solution: pick(SOLUTIONS[lang], i),
        parts: pick(PARTS[lang], i),
        notes: '',
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  // 7) business_cards (120)
  for (let k = 0; k < LANGS.length; k++) {
    const lang = LANGS[k]
    for (let i = 0; i < 20; i++) {
      const cid = customerIds[k * 20 + i]
      await db.business_cards.add({
        customerId: cid,
        dataUrl: '',
        name: pick(NAMES[lang], i),
        company: pick(COMPANIES[lang], i),
        title: pick(TITLES[lang], i),
        phone: `02-${randInt(100, 999)}-${randInt(1000, 9999)}`,
        mobile: randPhone(),
        email: `contact${i + 1}@example.com`,
        address: pick(ADDRESSES[lang], i),
        memo: '',
        createdAt: nowIso(),
      })
    }
  }

  // 8) equipment_maintenance (120)
  for (let k = 0; k < LANGS.length; k++) {
    const lang = LANGS[k]
    for (let i = 0; i < 20; i++) {
      const cid = customerIds[k * 20 + i]
      const intervalMonths = [1, 2, 3, 6, 12][i % 5]
      await db.equipment_maintenance.add({
        customerId: cid,
        name: pick(EQUIPMENTS[lang], i),
        photoUrl: '',
        intervalMonths,
        lastCheckedDate: randDate(-randInt(0, 180)),
        nextDueDate: randDate(randInt(-30, 60)),
      })
    }
  }

  // 9) user_alarms (120)
  for (let k = 0; k < LANGS.length; k++) {
    const lang = LANGS[k]
    for (let i = 0; i < 20; i++) {
      await db.user_alarms.add({
        title: `${pick(NAMES[lang], i)} - ${pick(EQUIPMENTS[lang], i)}`,
        date: randDate(randInt(-30, 30)),
        time: randTime(),
        note: pick(ALARM_NOTES[lang], i % 4),
        fired: i % 3 === 0 ? 1 : 0,
        createdAt: nowIso(),
      })
    }
  }

  // 10) suppliers (120)
  const supplierIds = []
  for (const lang of LANGS) {
    for (let i = 0; i < 20; i++) {
      const sid = await db.suppliers.add({
        items: pick(SUPPLIER_ITEMS[lang], i),
        name: pick(COMPANIES[lang], i),
        phone: `02-${randInt(100, 999)}-${randInt(1000, 9999)}`,
        phone2: randPhone(),
        address: pick(ADDRESSES[lang], i),
        email: `supplier${i + 1}@example.com`,
        memo: '',
        cardPhoto: '',
        createdAt: nowIso(),
      })
      supplierIds.push(sid)
    }
  }

  // 11) supplier_transactions (거래처당 2건 = 240)
  for (let k = 0; k < LANGS.length; k++) {
    const lang = LANGS[k]
    for (let i = 0; i < 20; i++) {
      const sid = supplierIds[k * 20 + i]
      for (let t = 0; t < 2; t++) {
        const rows = Array.from({ length: randInt(1, 3) }, (_, r) => {
          const qty = randInt(1, 10)
          const price = randInt(10, 200) * 1000
          return { name: pick(PARTS[lang], (i + r) % PARTS[lang].length), qty: String(qty), price: String(price) }
        })
        const subtotal = rows.reduce((s, r) => s + Number(r.qty) * Number(r.price), 0)
        const tax = Math.round(subtotal * 0.1)
        await db.supplier_transactions.add({
          supplierId: sid,
          date: randDate(-randInt(0, 90)),
          items: rows,
          subtotal,
          tax,
          total: subtotal + tax,
          memo: '',
          invoicePhoto: '',
          createdAt: nowIso(),
        })
      }
    }
  }

  return {
    customers: 120, service_jobs: 120, repair_logs: 120, checklist_results: 120,
    expenses: 120, knowhow: 120, business_cards: 120, equipment_maintenance: 120, user_alarms: 120,
    suppliers: 120, supplier_transactions: 240,
    total: 1440,
  }
}

// 테스트 데이터 전체 삭제 (모든 사용자 데이터 삭제됨 — 주의)
export async function deleteAllTestData() {
  await db.transaction('rw', [
    db.customers, db.service_jobs, db.job_photos, db.repair_logs,
    db.checklist_results, db.expenses, db.knowhow, db.business_cards,
    db.equipment_maintenance, db.user_alarms,
    db.suppliers, db.supplier_transactions,
  ], async () => {
    await db.customers.clear()
    await db.service_jobs.clear()
    await db.job_photos.clear()
    await db.repair_logs.clear()
    await db.checklist_results.clear()
    await db.expenses.clear()
    await db.knowhow.clear()
    await db.business_cards.clear()
    await db.equipment_maintenance.clear()
    await db.user_alarms.clear()
    await db.suppliers.clear()
    await db.supplier_transactions.clear()
  })
}
