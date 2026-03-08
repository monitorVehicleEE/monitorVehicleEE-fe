import { Spinner } from "react-bootstrap";
import React, { useEffect, useState } from "react";
import { Button, Container } from "react-bootstrap";
import { useNavigate, Navigate } from "react-router-dom";
import { emotionApi } from "../api/emotionApi";
import Loading from "../components/Loading";

function HomePage() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");

  const [todayEmotion, setTodayEmotion] = useState(null);
  const [emotion, setEmotion] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const emotions = [
    { type: "HAPPY", emoji: "😊", label: "Vui" },
    { type: "SAD", emoji: "😔", label: "Buồn" },
    { type: "ANGRY", emoji: "😡", label: "Tức giận" },
    { type: "ANXIOUS", emoji: "😰", label: "Lo lắng" },
    { type: "CALM", emoji: "😌", label: "Bình yên" },
    { type: "STRESSED", emoji: "😵", label: "Căng thẳng" },
  ];




  // lấy user info
  let user = JSON.parse(storedUser);
  // đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  // load cảm xúc
  const loadTodayEmotion = async () => {
    try {
      const res = await emotionApi.getTodayEmotion();
      setTodayEmotion(res.data);
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      setTodayEmotion(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodayEmotion();
  }, []);

  if (loading) {
    return <Loading/>;
  }


  // lưu lại cảm xúc hôm nay
  const submitEmotion = async () => {
    await emotionApi.createEmotion({
      emotion,
      note,
    });

    loadTodayEmotion();
  };

  return (
    <Container style={{ marginTop: "60px" }}>
      <h2>Trang chủ</h2>
      <hr />
      <h4>Xin chào {user?.username} 👋</h4>
      <Button variant="danger" className="mt-3" onClick={handleLogout}>
        Đăng xuất
      </Button>
      {/* Nếu chưa ghi cảm xúc */}
      {!todayEmotion && (
        <>
          <h5 className="mt-4">Hôm nay bạn cảm thấy thế nào?</h5>

          <div className="d-flex gap-2 mt-2">
            {emotions.map((e) => (
              <Button
                key={e.type}
                variant={emotion === e.type ? "primary" : "outline-secondary"}
                onClick={() => setEmotion(e.type)}
                className="d-flex flex-column align-items-center"
                style={{ width: "100px", height: "70px" }}
              >
                <span style={{ fontSize: "24px" }}>{e.emoji}</span>
                <br></br>
                <span style={{ fontSize: "12px" }}>{e.label}</span>
              </Button>
            ))}
          </div>

          <textarea
            className="form-control mt-3"
            placeholder="Bạn muốn chia sẻ gì thêm?"
            onChange={(e) => setNote(e.target.value)}
          />

          <Button className="mt-3" onClick={submitEmotion}>
            Lưu cảm xúc
          </Button>
        </>
      )}
      {/* Nếu đã ghi cảm xúc */}
      {todayEmotion && (
        <>
          <h5 className="mt-4">Cảm xúc hôm nay</h5>

          <p>
            Emotion: <b>{todayEmotion.emotion}</b>
          </p>

          <p>{todayEmotion.note}</p>
        </>
      )}
    </Container>
  );
}

export default HomePage;
