export enum Subject {
    LEADERSHIP = "지휘감독능력",
    RESPONSIBILITY = "책임감 및 적극성",
    ATTITUDE = "관리자로서의 자세 및 청렴도",
    INNOVATION = "경영의식 및 혁신성",
    SITUATIONAL_RESPONSE = "업무의이해도 및 상황대응력"
}

export interface Option {
    text: string;
    score: number;
}

export interface Question {
    passage: string;
    options: Option[];
    explanation: string;
    subject: Subject;
}