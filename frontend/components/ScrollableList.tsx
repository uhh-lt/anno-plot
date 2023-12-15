import React, {useContext, useEffect, useState} from 'react';
import {AppContext} from "../context/AppContext.tsx";
import {getPath, hexToRGBA} from "../utilities.tsx";

const ScrollableList = ({}) => {
  const {arrows, setArrows, codes, filteredCodes, data, loading} = useContext(AppContext);
  const [items, setItems] = useState([]);

  useEffect(() => {
    //filter arrows based on weather the code is in filteredCodes
    //and sort based on code id and dot id as a tie breaker

    if (loading) {
        return;
    }
    const filtered_arrows = arrows.filter(arrow => filteredCodes
        .includes(arrow.code_id))
        .sort((a, b) => a.dot_id - b.dot_id)
        .sort((a, b) => a.code_id - b.code_id);
    // for each arrow, find the corresponding data point
    const newItems = filtered_arrows.map(arrow => {
        const data_point = data.find(d => d.id === arrow.dot_id);
        if (!data_point) {
            return null;
        }
        let reduced_segment = data_point.segment.substring(0,20);
        if (data_point.segment.length > 20) {
            reduced_segment += "...";
        }
        return {
          id: arrow.dot_id,
            title: getPath(codes, codes.find(c => c.code_id === arrow.code_id)) + " (" + reduced_segment + ")",
            color: codes.find(c => c.code_id === arrow.code_id).color,
            //rewrite more infor to not use <p> tag, no <p> TAG!!
            moreInfo: (
    <span>
        {data_point.sentence.substring(0, data_point.start_position)}
        <strong><em><u>{data_point.segment}</u></em></strong>
        {data_point.sentence.substring(data_point.start_position + data_point.segment.length)}
    </span>
)
        }
    });
    setItems(newItems);
  }, [codes, arrows, filteredCodes, loading]);
const HeaderStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Darker background
    padding: '10px',
    width : "280px",
    borderRadius: '5px',
    color: 'white', // Assuming white text for contrast
    wordWrap: 'break-word'
  };

  const onDelete = (id) => {
    const copy_arrows = [...arrows];
    const index = copy_arrows.findIndex(a => a.dot_id === id);
    if (index !== -1) {
        copy_arrows.splice(index, 1);
        setArrows(copy_arrows);
    }
  }
return (
  <div style={{ overflowY: 'auto', maxHeight: '800px' }}>
    <div style={HeaderStyle}>
      {"Arrows:"}
    </div>
    {items.map((item, index) =>
      item !== null && <ListItem key={index} item={item} onDelete={() => onDelete(item.id)} />
    )}
  </div>
);
}

const ListItem = ({ item, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const textStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Darker background
    padding: '10px',
    width : "170px",
    borderRadius: '5px',
    color: 'white', // Assuming white text for contrast
    wordWrap: 'break-word'
  };
  const textStyleInfo = {
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Darker background
    padding: '10px',
    borderRadius: '5px',
    color: 'white', // Assuming white text for contrast
    wordWrap: 'break-word'
  };
    const deleteButtonStyle = {
    marginLeft: '10px',
    cursor: 'pointer',
      height: "50px",
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{  backgroundColor: hexToRGBA(item.color, 0.5), padding: '10px', margin: '5px', width: '260px', position: 'relative' }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div onClick={() => setIsExpanded(!isExpanded)} style={textStyle}>
        {item.title}
        </div>
        <button style={deleteButtonStyle} onClick={onDelete}>X</button>
        </div>
      <div style={{ backgroundColor: hexToRGBA(item.color, 0.5), }}>
        {isExpanded ? <p style={textStyleInfo}>{item.moreInfo}</p> : null}
      </div>
    </div>
  );
};

export default ScrollableList;
