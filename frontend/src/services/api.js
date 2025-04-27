import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "error";
axios.defaults.withCredentials = true;

export const registerUser = async (username, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/register`, { username, password });
    return response.data;
  } catch (error) {
    console.error("Error registering user:", error.response ? error.response.data : error);
    throw error;
  }
};

export const loginUser = async (username, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, { username, password });
    return response.data;
  } catch (error) {
    console.error("Error logging in:", error.response ? error.response.data : error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/logout`);
    return response.data;
  } catch (error) {
    console.error("Error logging out:", error.response ? error.response.data : error);
    throw error;
  }
};


export const addWord = async (word, translation, partOfSpeech, article) => {
    console.log("Sending data:", { word, translation, partOfSpeech, article }); // Log the data before sending  
  try {
    const response = await axios.post(`${API_BASE_URL}/add_word`, {
      word,
      translation,
      part_of_speech: partOfSpeech,
      article,
    });
    return response.data;
  } catch (error) {
    console.error("Error adding word:", error);
    throw error;
  }
};

export const getWords = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/get_words`);
      return response.data;
    } catch (error) {
      console.error("Error fetching words:", error);
      throw error;
    }
  };
  
  export const updateWord = async (wordId, word, translation, partOfSpeech, article) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/update_word/${wordId}`, {
        word,
        translation,
        part_of_speech: partOfSpeech,
        article,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating word:", error);
      console.log(wordId, word, translation, partOfSpeech, article);
      throw error;
    }
  };
  
  export const deleteWord = async (wordId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/delete_word/${wordId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting word:", error);
      throw error;
    }
  };

  export const getWord = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/get_word`);
      return response.data;
    } catch (error) {
      console.error("Error fetching word:", error);
      throw error;
    }
  };
  
  export const updateWordUsage = async (wordId, correct) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/update_word_usage`, {
        word_id: wordId,
        correct: correct ? true : false,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating word usage:", error.response ? error.response.data : error);
      throw error;
    }
  };
  
  export const startGameAPI = async (timeLimit) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/start_game`, {
        time_limit: timeLimit, // Only send time_limit now
      });
      return response.data;
    } catch (error) {
      console.error("Error starting game:", error);
      throw error;
    }
  };

  // services/api.js
  export const endGameAPI = async (
    timeLimit,
    gameType,
    zenMode,
    finalResults,
    finalAttempts,
    finalScore,
    ungraded // new boolean
  ) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/end_game`, {
        time_limit: timeLimit,
        game_type: gameType,
        zen_mode: zenMode,
        results: finalResults,
        total_attempts: finalAttempts,
        score: finalScore,
        ungraded: ungraded // pass the new field
      });
      return response.data;
    } catch (error) {
      console.error("Error ending game:", error);
      throw error;
    }
  };

  
  export const addConjugation = async (verb, person, tense, conjugation, irregular, pronominal, verbGroup) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/add_conjugation`, {
        verb,
        person,
        tense,
        conjugation,
        irregular,
        pronominal,
        verb_group: verbGroup
      });
      return response.data;
    } catch (error) {
      console.error("Error adding conjugation:", error);
      throw error;
    }
  };
  export const getConjugations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/get_conjugations`);
      return response.data;
    } catch (error) {
      console.error("Error fetching conjugations:", error);
      throw error;
    }
  };
  export const updateConjugation = async (id, verb, person, tense, conjugation, irregular, pronominal, verbGroup) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/update_conjugation/${id}`, {
        verb,
        person,
        tense,
        conjugation,
        irregular, 
        pronominal,
        verb_group: verbGroup
      });
      return response.data;
    } catch (error) {
      console.error("Error updating conjugation:", error);
      throw error;
    }
  };
  export const deleteConjugation = async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/delete_conjugation/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting conjugation:", error);
      throw error;
    }
  };

// ✅ Start Conjugation Game
export const startConjugationGameAPI = async (
  timeLimit,
  mode, 
  selectedTenses,       // array of strings
  selectedGroups,       // array of ints
  pronominalMode        // "only", "exclude", "both"
) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/start_conjugation_game`, {
      time_limit: timeLimit,
      mode: mode,  // "regular", "irregular", or "both"
      tenses: selectedTenses, 
      groups: selectedGroups, 
      pronominal_mode: pronominalMode
    });
    return response.data;  // { conjugations: [...] }
  } catch (error) {
    console.error("Error starting conjugation game:", error);
    throw error;
  }
};

// ✅ End Conjugation Game
// services/api.js

// End conj game with ungraded
// api.js

export const endConjugationGameAPI = async (
  timeLimit,
  mode,
  zenMode,
  ungraded,
  tenses,
  groups,
  pronominalMode,
  results,
  totalAttempts,
  score
) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/end_conjugation_game`, {
      time_limit: timeLimit,        // in seconds
      mode: mode,                   // "regular"/"irregular"/"both"
      zen_mode: zenMode,
      ungraded: ungraded,
      tenses: tenses,               // array of strings
      groups: groups,               // array of ints
      pronominal_mode: pronominalMode,
      results: results,
      total_attempts: totalAttempts,
      correct_answers: score
    });
    return response.data;
  } catch (error) {
    console.error("Error ending conjugation game:", error);
    throw error;
  }
};

export async function getStats(range = "all") {
  const res = await fetch(`${API_BASE_URL}/stats?range=${range}`, {
    credentials: "include"
  });
  if (!res.ok) {
    throw new Error("Failed to fetch stats");
  }
  return res.json();
}


        
  
  
  