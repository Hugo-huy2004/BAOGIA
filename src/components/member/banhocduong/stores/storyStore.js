import { create } from "zustand";

export const STORY_DATA = {
  1: {
    title: "Chương 1: Tiếng Gọi Nơi Thung Lũng",
    description: "Cậu thức giấc giữa một khu rừng phủ sương trắng. Một linh hồn dịu dàng dạng mây ánh sáng đang lơ lửng trước mặt cậu...",
    companion: "aura",
    nodes: {
      intro: {
        prompt: "Chào cậu, tớ là Aura. Tớ cảm thấy cậu đang mang một chút trĩu nặng từ thế giới bên kia. Cậu muốn cùng tớ đi dạo một lát không?",
        choices: [
          { id: "go_forest", label: "Đi dạo cùng Aura vào rừng", nextNode: "forest" },
          { id: "stay_here", label: "Ngồi nghỉ ngơi bên bờ suối", nextNode: "river" }
        ]
      },
      forest: {
        prompt: "Tiếng gió rì rào qua những tán cây. Aura hỏi: 'Cậu thường trút bỏ gánh nặng của mình bằng cách nào dạo gần đây?'",
        choices: [
          { id: "talk_bot", label: "Tâm sự với HugoPSY", nextNode: "finish_c1" },
          { id: "write_vent", label: "Viết Nhật Ký Tự Do để xả giận", nextNode: "finish_c1" }
        ]
      },
      river: {
        prompt: "Dòng suối trong vắt trôi lững lờ. Aura nói: 'Đôi khi chỉ cần ngồi yên lặng và lắng nghe nhịp thở của mình là đủ.'",
        choices: [
          { id: "breath_therapy", label: "Thực hiện Bài tập Thở 4-7-8", nextNode: "finish_c1" },
          { id: "read_book", label: "Đọc Sách Trị Liệu", nextNode: "finish_c1" }
        ]
      },
      finish_c1: {
        prompt: "Chúc mừng cậu đã vượt qua ngày đầu tiên đầy dũng cảm! Bạn rồng lửa Spark đã xuất hiện từ đống lửa trại, sẵn sàng tiếp thêm động lực cho cậu.",
        isEnd: true
      }
    }
  },
  2: {
    title: "Chương 2: Đốm Lửa Đêm Đen",
    description: "Màn đêm buông xuống, khu rừng lạnh lẽo hơn. Chú rồng nhỏ Spark quẫy đuôi, thắp lên ngọn lửa ấm áp.",
    companion: "spark",
    nodes: {
      intro: {
        prompt: "Chào cậu! Tớ là Spark. Tớ thích những thử thách ngày và vận động rèn luyện. Cậu đã sẵn sàng đối mặt với chướng ngại của ngày hôm nay chưa?",
        choices: [
          { id: "accept_challenge", label: "Chấp nhận thử thách của ngày", nextNode: "challenge" },
          { id: "rest_fire", label: "Ngồi sưởi ấm bên đống lửa", nextNode: "rest" }
        ]
      },
      challenge: {
        prompt: "Spark thách đấu cậu làm một hoạt động cải thiện năng lượng tích cực! Cậu muốn chọn nhiệm vụ nào?",
        choices: [
          { id: "do_checkin", label: "Check-in cảm xúc để nhận JOY", nextNode: "finish_c2" },
          { id: "sleep_ontime", label: "Ngủ sớm trước 11h tối nay", nextNode: "finish_c2" }
        ]
      },
      rest: {
        prompt: "Spark cuộn tròn ngủ yên bình. Một cái bóng đen mang mặt nạ dễ thương khẽ trườn ra khỏi bụi cỏ... Đó chính là Shadow.",
        choices: [
          { id: "meet_shadow", label: "Lại gần làm quen với Shadow", nextNode: "finish_c2" }
        ]
      },
      finish_c2: {
        prompt: "Đêm đen đã trôi qua. Sương mù tan dần, mở ra hành trình lắng nghe tiếng lòng của ngày tiếp theo.",
        isEnd: true
      }
    }
  }
};

export const useStoryStore = create((set, get) => ({
  currentChapter: 1,
  currentNode: "intro", // current node in current chapter
  activeCompanion: "aura", // aura, spark, shadow
  choiceHistory: [],
  storyPoints: 0,

  setChapter: (chapter) => {
    const chapterData = STORY_DATA[chapter];
    set({
      currentChapter: chapter,
      currentNode: "intro",
      activeCompanion: chapterData?.companion || "aura"
    });
  },

  setNode: (nodeId) => set({ currentNode: nodeId }),

  makeChoice: (choiceId, label, nextNode) => {
    const { currentChapter, currentNode, choiceHistory } = get();
    const updatedHistory = [
      ...choiceHistory,
      {
        chapter: currentChapter,
        node: currentNode,
        choiceId,
        label,
        date: new Date().toISOString()
      }
    ];

    set({
      choiceHistory: updatedHistory,
      currentNode: nextNode,
      storyPoints: get().storyPoints + 15
    });

    // Automatically update active companion based on choice if defined
    if (choiceId === "meet_shadow") {
      set({ activeCompanion: "shadow" });
    }
  },

  resetStory: () => set({
    currentChapter: 1,
    currentNode: "intro",
    activeCompanion: "aura",
    choiceHistory: [],
    storyPoints: 0
  })
}));
