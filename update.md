Snapshot 스키마 & Collaborator 개편 반영

너는 지금 레포 전체를 이해하고, 새 스키마/개념에 맞게 페이지 → 파서 → 규칙 문서까지 한 번에 정리하는 역할이다.
아래 순서를 그대로 따라가면서 변경해줘.

⸻

1.  새 개념 먼저 이해하기 1. snapshot-guide-v1.md 파일을 열어서 다음 두 가지를 정확히 파악해라.

        •	스냅샷 위계:
        •	이전: domain -> project -> topic
        •	현재: domain -> project -> module -> topic
        •	Collaborators 개념:
        •	이전: waiting-on 관계
        •	현재: pre / post 관계 (이 작업 전에 영향을 주는 협업자 vs 이 작업 이후에 영향을 받는 협업자)

        2.	snapshot-guide-v1.md 내용을 5줄 정도로 요약해서 너 스스로 메모를 만든 다음, 그 요약을 기준으로 아래 작업들을 진행해라.

    (실제 코드/문서에는 요약을 넣을 필요는 없다. 너만 이해용으로 사용해라.)

⸻

2. UI / 페이지 전반에 새 위계 & Collaborator 반영

2-1) 전체 검색으로 영향 범위 파악 1. 레포 전체에서 다음 키워드들을 검색해라.

    •	waiting-on
    •	waitingOn, waiting_on, waiting 관련 collaborator 필드
    •	"domain", "project", "topic" 조합으로 필터/정렬/그룹핑/타입 정의에 사용된 부분

    2.	검색된 결과를 기준으로,

    •	타입/스키마 정의
    •	UI 컴포넌트 (리스트, 카드, 테이블, 차트, 필터, 태그 등)
    •	API/파서 결과를 사용하는 부분

이 세 부류로 대략 분류해 두고, 부류별로 정리해서 수정해라.

2-2) 스냅샷 위계: domain -> project -> module -> topic 반영 1. 먼저 타입/스키마부터 정리해라.

    •	스냅샷 관련 TypeScript 타입, Zod 스키마, JSON 스키마 등이 있다면:
    •	domain, project, topic만 있던 구조에 module 필드를 추가한다.
    •	module은 필수인지/선택인지 snapshot-guide-v1.md와 data/submitted-scrum.txt를 보고 결정해라.
    •	선택 필드라면 UI에서 module이 비어 있을 때의 기본 표기를 통일해라. (예: "-" 또는 "기본" 등 레포에 이미 쓰고 있는 패턴을 따를 것)

    2.	data/submitted-scrum.txt 파일을 열고, 실제 데이터가 어떤 형식으로 module을 표현하고 있는지 확인해라.

    •	예) domain / project / module / topic 형식의 한 줄, 또는 키-값 포맷, 또는 구분자 기반 포맷 등
    •	이 실제 포맷에 맞춰서 UI 계층 구조를 맞춘다.

    3.	스냅샷을 보여주는 모든 UI에서 계층을 다음처럼 바꿔라.

    •	타이틀/뱃지/태그/컬럼 이름 등에서:
    •	기존: [{domain}] {project} / {topic}
    •	변경: [{domain}] {project} / {module} / {topic} 또는 그에 준하는 구조
    •	필터/검색/그룹핑에서도 module을 독립적인 축으로 다루되,
    •	domain, project, module, topic 간의 계층 관계가 헷갈리지 않게 라벨링을 명확히 해라.

    4.	module이 없는 구 데이터(과거 스냅샷)를 다루는 로직이 있다면:

    •	파서/변환 단계에서 기본값을 채워 넣거나,
    •	UI에서 안전하게 fallback 되도록 처리해라.

2-3) Collaborators: waiting-on → pre / post 관계로 전환 1. 스냅샷/업무 단위에서 협업 데이터를 표현하는 타입/스키마/모델을 먼저 고친다.

    •	예시(실제 타입 이름/필드 이름은 레포 기준으로 맞춰라):
    •	변경 전 (예시)
    •	collaborators: { waitingOn: string[] }
    •	변경 후 (예시)
    •	collaborators: { pre: string[]; post: string[] }
    •	실제 레포에 이미 pre, post 필드가 있다면 그 구조를 그대로 따른다.

    2.	data/submitted-scrum.txt에 이미 새 구조(pre, post)가 반영돼 있다면,

    •	그 구조를 기준으로 타입/스키마를 맞춰라.
    •	만약 아직 waiting-on 형태의 레거시 데이터도 같이 존재한다면,
    •	파서 단계에서 waiting-on → 적절한 pre 또는 post로 매핑하는 마이그레이션 로직을 넣어라.

    3.	UI 레벨에서:

    •	기존에 waiting-on을 보여주던 곳은
    •	pre 협업자 목록, post 협업자 목록을 명확히 구분해서 표현해라.
    •	예: "Pre 협업자" / "Post 협업자" 섹션, 아이콘/색상/정렬 등으로 시각적으로도 구분.
    •	개인 대시보드, 팀 대시보드, 그래프/차트 등에서
    •	협력 흐름을 “앞뒤 흐름(pre→me→post)” 관점으로 인식할 수 있게 표시해라.

    4.	모든 관련 텍스트 카피도 정리해라.

    •	문서/툴팁/라벨에서 waiting-on이라는 문구가 남아 있으면,
    •	pre 협업, post 협업, 혹은 이전 단계 협업자, 후속 단계 협업자 등 새 개념에 맞게 변경한다.

⸻

3. parse:scrum 스크립트 수정 (submitted-scrum.txt → JSON 변환)

3-1) 파서 위치 찾기 1. package.json에서 "parse:scrum" 스크립트를 찾아라.

    •	예: "parse:scrum": "ts-node scripts/parseScrum.ts" 같은 형태일 가능성이 높다.
    •	실제로 어떤 파일을 실행하는지 확인하고, 그 파일을 열어라.

    2.	그 파일 안에서:

    •	입력: data/submitted-scrum.txt를 어떻게 읽는지
    •	출력: 어디에 JSON/타입 파일을 생성하는지 (예: ./data/scrum/*.json 등)

을 먼저 파악해라.

3-2) 새 스키마에 맞게 파싱 로직 수정 1. data/submitted-scrum.txt의 현재 포맷을 기준으로,

    •	각 줄(또는 블록)이 domain, project, module, topic을 어떤 규칙으로 담고 있는지 분석해라.
    •	기존에는 domain, project, topic만 파싱하던 로직이 있을 것이므로,
    •	그 부분을 module을 포함하도록 수정한다.

    2.	Collaborators 파싱:

    •	pre, post 정보를 어디서 어떻게 가져오는지 확인해라.
    •	만약 여전히 waiting-on 형식이 남아 있다면,
    •	파서 단계에서 waiting-on → pre 또는 post로 일관된 규칙을 적용해서 변환해라.
    •	최종 JSON 구조가 snapshot-guide-v1.md의 정의와 일치하도록 필드 이름과 구조를 맞춰라.

    3.	타입/검증:

    •	이 파서 결과를 검증하는 타입(Zod, TS 인터페이스, 타입 정의 등)이 있다면 함께 업데이트해라.
    •	모든 필수 필드와 선택 필드를 명확히 하고, 불필요한 any가 생기지 않도록 정리해라.

3-3) 실행 & 검증 1. npm run parse:scrum (또는 레포에서 사용 중인 패키지 매니저 명령)을 실제로 실행했다고 가정하고,

    •	결과물로 생성되는 JSON 파일의 구조를 코드 상에서 확인해라.
    •	하나의 샘플 스냅샷 객체를 주석이나 별도 메모로 남겨,
    •	domain, project, module, topic, collaborators.pre, collaborators.post가 모두 들어 있는지 체크해라.

    2.	이 파서 결과를 사용하는 코드들(페이지, 대시보드, 통계 등)에서 타입 오류가 없는지 확인하고,

    •	필요하다면 import/export, 타입 정의, 유틸 함수 등을 함께 정리해라.

⸻

4.  rule_all.md 지침 문서 업데이트 1. rule_all.md 파일을 열어서,

        •	스냅샷 위계 관련 설명이 여전히 domain -> project -> topic이라고 쓰여 있는지 확인하고,
        •	모두 domain -> project -> module -> topic으로 업데이트해라.
        •	Collaborators 설명이 waiting-on 중심이라면,
        •	pre / post 관점의 협업 흐름으로 완전히 바꿔라.

        2.	문서 구조는 유지하되, 아래 내용을 반드시 포함하도록 수정해라.

        •	스냅샷 기본 단위 정의에 module을 명시
        •	인사이트 도출 시:
        •	“어떤 domain/project/module/topic 조합에서 어떤 패턴이 보이는지”
        •	“pre 협업자와 post 협업자 흐름 속에서 병목/리스크/지식 편중이 어디서 발생하는지”

    를 읽어내도록 유도하는 문장 추가
    • 예시 섹션이 있다면,
    • 최소 한 개 이상은 module과 pre/post가 포함된 최신 스냅샷 사례로 교체해라.

        3.	기존 내용과 충돌하는 문장이 남지 않도록,

        •	waiting-on이라는 옛 개념과 섞여 보이는 부분은 모두 제거하거나 새 개념으로 재서술해라.

⸻

5.  최종 점검 플로우 1. 타입/스키마 레벨 점검

        •	TS 타입, Zod 스키마, JSON 구조에서
        •	domain, project, module, topic과
        •	collaborators.pre, collaborators.post가

    일관되게 사용되는지 확인해라.

        2.	UI 동작 점검 (로컬 기준으로 가정)

        •	스냅샷 리스트/대시보드/차트 화면에서:
        •	계층 표기: domain → project → module → topic이 정상 노출되는지
        •	필터/검색/그룹핑에 module이 잘 작동하는지
        •	협업자 영역에 pre / post가 분리되어 보이는지
        •	예외 케이스:
        •	module이 없는 데이터
        •	pre 또는 post가 비어 있는 데이터

    등에 대한 fallback UI도 확인해라.

        3.	문서 정합성

        •	snapshot-guide-v1.md, rule_all.md, 그리고 실제 코드/데이터가

    서로 다른 개념을 쓰고 있지 않은지 용어/위계/예시를 기준으로 다시 한 번 비교해라.

        4.	작업 요약

        •	마지막으로, 어떤 파일들을 어떻게 수정했는지
        •	타입/스키마
        •	UI
        •	파서(parse:scrum)
        •	문서(rule_all.md)

    네 묶음으로 짧게 정리한 요약을 제공해라. (diff 설명 수준으로)
