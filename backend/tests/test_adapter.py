"""Tests for Blackboard catalog adapter."""
import pytest
from bs4 import BeautifulSoup
from backend.app.adapters.blackboard import BlackboardCatalogAdapter
from backend.app.models.domain import CourseRecord


SAMPLE_HTML = """
<html>
<body>
<div id="listContainer_itemcount">
    <span>Displaying <strong>1</strong> to <strong>25</strong> of <strong>66307</strong> items</span>
</div>
<table id="listContainer_datatable" class="inventory sortable">
<tbody>
<tr id="listContainer_row:0">
    <th scope="row" class="" valign="top"><a target="_top" href="/webapps/blackboard/execute/courseMain?course_id=_41471_1">18191S_BB_Training</a></th>
    <td class="" valign="top"><span class="mobile-table-label">Course Name: </span><span class="table-data-cell-value">Blackboard Training</span></td>
    <td class="" valign="top"><span class="mobile-table-label">Instructor: </span><span class="table-data-cell-value">Ronald Arciaga, Julian Albert Nohay</span></td>
    <td class="" valign="top"><span class="mobile-table-label">Description: </span><span class="table-data-cell-value"></span></td>
</tr>
<tr id="listContainer_row:1">
    <th scope="row" class="" valign="top">0625_RESTORED_CAD10L-1_B24_3T2526</th>
    <td class="" valign="top"><span class="mobile-table-label">Course Name: </span><span class="table-data-cell-value">COMPUTER-AIDED DRAFTING</span></td>
    <td class="" valign="top"><span class="mobile-table-label">Instructor: </span><span class="table-data-cell-value">CARLITO GUTIERREZ, BIENVENIDO MAUNAHAN</span></td>
    <td class="" valign="top"><span class="mobile-table-label">Description: </span><span class="table-data-cell-value">Course description here</span></td>
</tr>
<tr id="listContainer_row:2">
    <th scope="row" class="" valign="top">3DMOGC013_AM27_1Q2627</th>
    <td class="" valign="top"><span class="mobile-table-label">Course Name: </span><span class="table-data-cell-value">3D MODELLING & GRAPHICS CONSTRUCTION</span></td>
    <td class="" valign="top"><span class="mobile-table-label">Instructor: </span><span class="table-data-cell-value"></span></td>
    <td class="" valign="top"><span class="mobile-table-label">Description: </span><span class="table-data-cell-value"></span></td>
</tr>
<tr id="listContainer_row:3">
    <th scope="row" class="" valign="top"><a target="_top" href="/webapps/blackboard/execute/courseMain?course_id=_30247_1">A31</a></th>
    <td class="" valign="top"><span class="mobile-table-label">Course Name: </span><span class="table-data-cell-value">ENGLISH FOR THE WORKPLACE 1</span></td>
    <td class="" valign="top"><span class="mobile-table-label">Instructor: </span><span class="table-data-cell-value">AIDA ALFARO</span></td>
    <td class="" valign="top"><span class="mobile-table-label">Description: </span><span class="table-data-cell-value"></span></td>
</tr>
</tbody>
</table>
</body>
</html>
"""


def test_parse_catalog_page():
    adapter = BlackboardCatalogAdapter()
    records, total = adapter._parse_catalog_page(SAMPLE_HTML, "_758_1", "test_snap")

    assert total == 66307
    assert len(records) == 4

    # First record - has link with course_id
    r0 = records[0]
    assert r0.source_id == "_41471_1"
    assert r0.course_code == "18191S_BB_Training"
    assert r0.course_name == "Blackboard Training"
    assert r0.instructors == ["Ronald Arciaga", "Julian Albert Nohay"]
    assert r0.description is None
    assert r0.term_id == "_758_1"
    assert r0.snapshot_id == "test_snap"

    # Second record - no link, multiple instructors
    r1 = records[1]
    assert r1.source_id == "0625_RESTORED_CAD10L-1_B24_3T2526"
    assert r1.course_name == "COMPUTER-AIDED DRAFTING"
    assert r1.instructors == ["CARLITO GUTIERREZ", "BIENVENIDO MAUNAHAN"]
    assert r1.description == "Course description here"

    # Third record - empty instructors
    r2 = records[2]
    assert r2.instructors == []

    # Fourth record - has link, single instructor
    r3 = records[3]
    assert r3.source_id == "_30247_1"
    assert r3.course_code == "A31"
    assert r3.course_name == "ENGLISH FOR THE WORKPLACE 1"
    assert r3.instructors == ["AIDA ALFARO"]


def test_parse_empty_instructors():
    """Test handling of empty instructor field."""
    html = """
    <table id="listContainer_datatable"><tbody>
    <tr id="listContainer_row:0">
        <th>TEST101</th>
        <td><span class="table-data-cell-value">Test Course</span></td>
        <td><span class="table-data-cell-value"></span></td>
        <td><span class="table-data-cell-value"></span></td>
    </tr>
    </tbody></table>
    <div id="listContainer_itemcount">of <strong>1</strong></div>
    """
    adapter = BlackboardCatalogAdapter()
    records, _ = adapter._parse_catalog_page(html, "_758_1", "snap")
    assert len(records) == 1
    assert records[0].instructors == []


def test_parse_missing_table_raises():
    """Test that missing table raises ValueError."""
    adapter = BlackboardCatalogAdapter()
    with pytest.raises(ValueError, match="Catalog table not found"):
        adapter._parse_catalog_page("<html><body>No table here</body></html>", "_758_1", "snap")


def test_extract_cell_value_handles_mobile_labels():
    """Test that mobile-table-label spans are removed."""
    html = '<td><span class="mobile-table-label">Instructor: </span><span class="table-data-cell-value">PROF NAME</span></td>'
    soup = BeautifulSoup(html, "lxml")
    td = soup.find("td")
    adapter = BlackboardCatalogAdapter()
    result = adapter._extract_cell_value(td)
    assert result == "PROF NAME"


def test_extract_cell_value_fallback():
    """Test fallback when table-data-cell-value is missing."""
    html = '<td>Direct text content</td>'
    soup = BeautifulSoup(html, "lxml")
    td = soup.find("td")
    adapter = BlackboardCatalogAdapter()
    result = adapter._extract_cell_value(td)
    assert result == "Direct text content"