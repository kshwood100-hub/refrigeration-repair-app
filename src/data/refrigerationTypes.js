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
  },
  {
    id: 'basic_cycle',
    title: '기본 냉동 사이클',
    title_en: 'Basic Refrigeration Cycle',
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
  },
  {
    id: 'pressure_temp',
    title: '압력과 온도의 관계 (P-T)',
    title_en: 'Pressure-Temperature Relationship (P-T)',
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
  },
  {
    id: 'superheat_subcool',
    title: '과열도와 과냉도',
    title_en: 'Superheat and Subcooling',
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
  },
  {
    id: 'compressor_types',
    title: '압축기 종류와 특징',
    title_en: 'Compressor Types and Characteristics',
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
  },
  {
    id: 'temp_range',
    title: '사용 온도 범위',
    title_en: 'Operating Temperature Ranges',
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
  },
  {
    id: 'refrigerants',
    title: '냉매 종류와 특성',
    title_en: 'Refrigerant Types and Properties',
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
  },
  {
    id: 'oil',
    title: '냉동기유 (오일)',
    title_en: 'Refrigeration Oil',
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
  },
  {
    id: 'cooling_method',
    title: '응축 방식',
    title_en: 'Condensing Methods',
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
  },
  {
    id: 'expansion',
    title: '팽창장치 종류',
    title_en: 'Expansion Device Types',
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
  },
  {
    id: 'defrost',
    title: '착상과 제상',
    title_en: 'Frost Buildup and Defrost',
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
  },
  {
    id: 'electric_control',
    title: '전기/제어 기초',
    title_en: 'Electrical and Control Basics',
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
  },
  {
    id: 'common_failures',
    title: '주요 고장 패턴',
    title_en: 'Common Failure Patterns',
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
  },
  {
    id: 'site_checklist',
    title: '현장 도착 후 점검 순서',
    title_en: 'On-Site Inspection Sequence',
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
  },
  {
    id: 'special_systems',
    title: '특수 냉동 시스템',
    title_en: 'Special Refrigeration Systems',
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
  },
  {
    id: 'safety',
    title: '안전 수칙',
    title_en: 'Safety Guidelines',
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
  },
]
