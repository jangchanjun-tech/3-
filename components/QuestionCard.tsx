import React from 'react';
import { Question, Option } from '../types';

interface QuestionCardProps {
  question: Question;
  index: number;
  isSubmitted: boolean;
  selectedOptions: number[];
  onSelectOption: (questionIndex: number, optionIndex: number) => void;
}

const getOptionDetailsFromScore = (score: number) => {
    switch (score) {
      case 3:
        return {
          type: '최선의 선택',
          badgeClass: 'bg-green-100 text-green-800',
          borderClass: 'border-green-500'
        };
      case 2:
        return {
          type: '차선의 선택',
          badgeClass: 'bg-yellow-100 text-yellow-800',
          borderClass: 'border-yellow-500'
        };
      case 1:
        return {
          type: '최악의 선택',
          badgeClass: 'bg-red-100 text-red-800',
          borderClass: 'border-red-500'
        };
      default:
        return {
          type: '기타',
          badgeClass: 'bg-gray-100 text-gray-800',
          borderClass: 'border-gray-300'
        };
    }
  };

const OptionItem: React.FC<{
  option: Option;
  questionIndex: number;
  optionIndex: number;
  isSelected: boolean;
  isSubmitted: boolean;
  onSelectOption: (questionIndex: number, optionIndex: number) => void;
}> = ({ option, questionIndex, optionIndex, isSelected, isSubmitted, onSelectOption }) => {
  const { type, badgeClass, borderClass } = getOptionDetailsFromScore(option.score);
  const baseClasses = "flex items-start w-full text-left py-3 px-4 rounded-lg transition-all duration-200 border-2";
  const interactionClasses = isSubmitted ? "cursor-default" : "hover:bg-blue-50 hover:border-blue-400";
  const selectedClasses = isSelected ? "bg-blue-100 border-blue-500" : "bg-gray-50 border-transparent";
  const submittedBorderClasses = isSubmitted && isSelected ? borderClass : "";

  return (
    <li className="flex items-center">
      <button
        onClick={() => onSelectOption(questionIndex, optionIndex)}
        disabled={isSubmitted}
        className={`${baseClasses} ${interactionClasses} ${!isSubmitted ? selectedClasses : ''} ${submittedBorderClasses}`}
        aria-pressed={isSelected}
      >
        <span className="text-blue-600 font-bold mr-3">{String.fromCharCode(65 + optionIndex)}.</span>
        <div className="flex-1">
            <p className="text-gray-800">{option.text}</p>
        </div>
        {isSubmitted && (
            <div className="ml-4 flex-shrink-0">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${badgeClass}`}>
                    {type} ({option.score}점)
                </span>
            </div>
        )}
      </button>
    </li>
  );
};

const QuestionCard: React.FC<QuestionCardProps> = ({ question, index, isSubmitted, selectedOptions, onSelectOption }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-200">
      <div className="p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">
          <span className="text-blue-600">문제 {index + 1}.</span>
        </h3>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-6 rounded-lg border border-gray-200">
          {question.passage}
        </p>
        <div className="mt-8">
          <h4 className="text-lg font-semibold text-gray-700 mb-4">선택지 (2개 선택)</h4>
          <ul className="space-y-4">
            {question.options.map((option, optionIndex) => (
              <OptionItem
                key={optionIndex}
                option={option}
                questionIndex={index}
                optionIndex={optionIndex}
                isSelected={selectedOptions.includes(optionIndex)}
                isSubmitted={isSubmitted}
                onSelectOption={onSelectOption}
              />
            ))}
          </ul>
        </div>
        {isSubmitted && (
            <div className="mt-8 bg-indigo-50 p-6 rounded-lg border border-indigo-200">
                <h4 className="text-lg font-bold text-indigo-800 mb-3">해설</h4>
                <p className="text-indigo-900 leading-relaxed whitespace-pre-wrap">{question.explanation}</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default QuestionCard;