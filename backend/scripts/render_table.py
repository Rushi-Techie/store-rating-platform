import os
from PIL import Image, ImageDraw, ImageFont

def render_table():
    # Dimensions
    width = 850
    height = 290
    
    # Create image canvas
    img = Image.new('RGB', (width, height), color='#ffffff')
    draw = ImageDraw.Draw(img)
    
    # Load Arial font
    try:
      header_font = ImageFont.truetype("arialbd.ttf", 13)
      data_font = ImageFont.truetype("arial.ttf", 13)
    except IOError:
      header_font = ImageFont.load_default()
      data_font = ImageFont.load_default()

    # Column specifications (X start offsets)
    cols = [
        {"name": "User Name", "x": 20, "w": 240},
        {"name": "Email Address", "x": 270, "w": 180},
        {"name": "Password", "x": 460, "w": 140},
        {"name": "Role / Dashboard", "x": 610, "w": 220}
    ]
    
    # Data Rows
    rows = [
        ["System Administrator Account", "admin@platform.com", "AdminPass123!", "System Administrator"],
        ["Regular Customer John Doe", "john@user.com", "UserPass123!", "Normal User (Customer)"],
        ["Regular Customer Jane Smith", "jane@user.com", "UserPass123!", "Normal User (Customer)"],
        ["Gourmet Coffee Shop & Cafe", "gourmet@store.com", "StorePass123!", "Store Owner (Store)"],
        ["Supermarket Grocery Store", "grocer@store.com", "StorePass123!", "Store Owner (Store)"],
        ["Tech Electronics Outlet Store", "electronics@store.com", "StorePass123!", "Store Owner (Store)"]
    ]
    
    # Draw outer container border
    draw.rectangle([10, 10, width - 10, height - 10], outline='#cbd5e1', width=1)
    
    # Draw Header Background (Royal Blue)
    draw.rectangle([10, 10, width - 10, 45], fill='#2563eb')
    
    # Draw Header Titles
    for c in cols:
        draw.text((c["x"], 20), c["name"], fill="#ffffff", font=header_font)
        
    # Draw Rows
    y_offset = 45
    row_height = 38
    
    for idx, r in enumerate(rows):
        # Alternating background colors
        bg_color = "#ffffff" if idx % 2 == 0 else "#f8fafc"
        draw.rectangle([10, y_offset, width - 10, y_offset + row_height], fill=bg_color)
        
        # Row bottom border line
        draw.line([10, y_offset + row_height, width - 10, y_offset + row_height], fill='#e2e8f0', width=1)
        
        # Text values
        for c_idx, val in enumerate(r):
            x_pos = cols[c_idx]["x"]
            # Center vertically in the row cell
            draw.text((x_pos, y_offset + 12), val, fill="#0f172a", font=data_font)
            
        y_offset += row_height
        
    # Save Image to workspace root
    output_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "test_accounts_table.png")
    img.save(output_path, "PNG")
    print(f"Table image rendered successfully and saved to: {output_path}")

if __name__ == "__main__":
    render_table()
